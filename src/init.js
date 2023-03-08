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
            const unitedPosts = [...state.rssLoading.posts, updatedPost];
            const allPostsWithID = unitedPosts.map((post) => {
              const newPostNumber = unitedPosts.indexOf(post);
              return { ...post, postId: `${updatedFeed.id}${newPostNumber}` };
            });
            state.rssLoading.posts = allPostsWithID;
          }
        });
      });
    })
    .catch(() => console.log('Net Error'))
    .finally(() => setTimeout(request, 5000, state));
};

const app = (i18nextInstance) => {
  const initialState = {
    formState: {
      language: 'ru',
      url: null,
      validationError: null,
      feedsUrls: [],
    },
    rssLoading: {
      state: 'initial',
      feeds: [],
      posts: [],
      error: null,
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
    const { feedsUrls } = watchedState.formState;
    validate(url, feedsUrls)
      .then((checkedUrl) => {
        watchedState.formState.url = url;
        watchedState.formState.validationError = null;
        watchedState.formState.feedsUrls.push(checkedUrl);
        watchedState.rssLoading.state = 'loading';
        const myUrl = addProxy(url);
        return axios.get(myUrl);
      })
      .then((response) => {
        const rssString = response.data.contents;
        const feed = parse(rssString);
        const { posts } = feed;
        const id = _.uniqueId();
        const modifiedFeed = { ...feed, url, id };
        watchedState.rssLoading.feeds.push(modifiedFeed);
        const unitedPosts = [...watchedState.rssLoading.posts, ...posts];
        const allPostsWithID = unitedPosts.map((post) => {
          const newPostNumber = unitedPosts.indexOf(post);
          return { ...post, postId: `${feed.id}${newPostNumber}` };
        });
        watchedState.rssLoading.posts = allPostsWithID;
        watchedState.rssLoading.error = null;
        watchedState.rssLoading.state = 'processed';
      })
      .catch((error) => {
        if (_.isObject(error) && error.code) {
          watchedState.rssLoading.state = 'failed';
          watchedState.rssLoading.error = 'netError';
          watchedState.formState.feedsUrls.pop();
        } else if (error.toString() === 'Error: Not a rss!') {
          watchedState.rssLoading.state = 'failed';
          watchedState.rssLoading.error = 'rssError';
          watchedState.formState.feedsUrls.pop();
        } else if (_.isObject(error) && error.errors) {
          const [errorType] = error.errors;
          if (errorType === 'this must be a valid URL') {
            watchedState.formState.validationError = 'validationErrorNotURL';
          } else {
            watchedState.formState.validationError = 'validationErrorExistedURL';
          }
        }
      })
      .finally(() => request(watchedState));
  });
  const myModal = document.querySelector('#modal');
  myModal.addEventListener('shown.bs.modal', (event) => {
    const buttonModal = event.relatedTarget;
    const anchor = buttonModal.previousElementSibling;
    const anchorId = anchor.getAttribute('data-id');
    watchedState.uiState.modal.openedWindowId = anchorId;
    watchedState.uiState.modal.readingState.push(anchorId);
  });
};

export default () => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources,
  }).then(() => app(i18nextInstance));
};
