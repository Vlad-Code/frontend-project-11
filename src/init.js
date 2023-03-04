/* eslint-disable no-param-reassign */
import 'bootstrap';
import * as yup from 'yup';
import 'bootstrap/dist/css/bootstrap.min.css';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import watchState from './view.js';
import resources from './locales/index.js';
import parse from './parse.js';

const addProxy = (url) => {
  const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', 'true');
  return urlWithProxy.toString();
};

const request = (state) => {
  state.automaticallyLoading.state = 'loading';
  const { feeds, posts } = state.rssLoading;
  const proxyUrls = feeds.map((feed) => addProxy(feed.url));
  const requests = proxyUrls.map((proxyUrl) => axios.get(proxyUrl));
  Promise.all(requests)
    .then((responses) => {
      responses.forEach((response) => {
        const index = responses.indexOf(response);
        const actualFeed = feeds[index];
        const rssString = response.data.contents;
        const updatedFeed = parse(rssString);
        updatedFeed.id = actualFeed.id;
        const updatedPosts = updatedFeed.posts;
        updatedPosts.forEach((updatedPost) => {
          const oldPosts = posts.filter((post) => {
            if (post.postTitle === updatedPost.postTitle
            && post.postLink === updatedPost.postLink) {
              return true;
            }
            return false;
          });
          if (oldPosts.length === 0) {
            state.rssLoading.posts.push(updatedPost);
            const newPosts = state.rssLoading.posts;
            newPosts.forEach((newPost) => {
              const newPostNumber = newPosts.indexOf(newPost);
              newPost.postId = `${updatedFeed.id}${newPostNumber}`;
            });
          }
        });
        state.automaticallyLoading.error = null;
        state.automaticallyLoading.state = 'processed';
      });
    });
  setTimeout(request, 5000, state);
};

const app = (i18nextInstance) => {
  const initialState = {
    formState: {
      language: 'ru',
      url: null,
      valid: true,
      validationError: null,
      feedsUrls: [],
    },
    rssLoading: {
      state: 'initial',
      feeds: [],
      posts: [],
      error: null,
    },
    automaticallyLoading: {
      state: 'initial',
    },
    uiState: {
      modal: {
        openedWindowId: null,
        readingState: [],
      },
    },
  };
  const watchedState = watchState(initialState, i18nextInstance);
  const validate = (url, feedsUrls) => {
    const schema = yup.string().trim().required().url()
      .notOneOf(feedsUrls);
    return schema.validate(url, { abortEarly: false });
  };
  const form = document.querySelector('.rss-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    watchedState.formState.url = url;
    const { feedsUrls } = watchedState.formState;
    validate(url, feedsUrls)
      .then((checkedUrl) => {
        watchedState.formState.valid = true;
        watchedState.formState.validationError = null;
        watchedState.formState.feedsUrls.push(checkedUrl);
        watchedState.rssLoading.state = 'loading';
        const newFeedUrl = _.last(feedsUrls);
        const myUrl = addProxy(newFeedUrl);
        axios.get(myUrl)
          .then((response) => {
            const rssString = response.data.contents;
            const feed = parse(rssString);
            const { title, posts } = feed;
            if (title === null && posts.length === 0) {
              watchedState.rssLoading.state = 'failed';
              watchedState.rssLoading.error = 'ERR_CONTENT';
              watchedState.formState.feedsUrls.pop();
              throw new Error('Not a rss!');
            }
            feed.url = newFeedUrl;
            feed.id = _.uniqueId();
            watchedState.rssLoading.feeds.push(feed);
            watchedState.rssLoading.posts = [...watchedState.rssLoading.posts, ...posts];
            const newPosts = watchedState.rssLoading.posts;
            newPosts.forEach((newPost) => {
              const newPostNumber = newPosts.indexOf(newPost);
              newPost.postId = `${feed.id}${newPostNumber}`;
            });
            watchedState.rssLoading.state = 'processed';
          })
          .catch((error) => {
            watchedState.rssLoading.state = 'failed';
            watchedState.rssLoading.error = error.code;
          });
      })
      .catch((error) => {
        /* console.log(error);
        if (_.isObject(error) && error.code) {
          watchedState.rssLoading.state = 'failed';
          watchedState.rssLoading.error = error.code;
        } */ if (error === 'Error: Not a rss!') {
          watchedState.rssLoading.state = 'failed';
          watchedState.rssLoading.error = 'ERR_CONTENT';
          watchedState.formState.feedsUrls.pop();
        } else if (_.isObject(error) && error.errors) {
          const [errorType] = error.errors;
          watchedState.formState.valid = false;
          watchedState.formState.validationError = errorType;
        }
      });
  });
  const myModal = document.querySelector('#modal');
  myModal.addEventListener('shown.bs.modal', (event) => {
    const buttonModal = event.relatedTarget;
    const anchor = buttonModal.previousElementSibling;
    const anchorId = anchor.getAttribute('data-id');
    watchedState.uiState.modal.openedWindowId = anchorId;
    watchedState.uiState.modal.readingState.push(anchorId);
  });
  request(watchedState);
};

export default () => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources,
  }).then(() => app(i18nextInstance));
};
