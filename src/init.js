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
  const { feeds, posts } = state;
  const proxyUrls = feeds.map((feed) => addProxy(feed.url));
  const requests = proxyUrls.map((proxyUrl) => axios.get(proxyUrl));
  Promise.all(requests)
    .then((responses) => {
      responses.forEach((response) => {
        const index = responses.indexOf(response);
        const actualFeed = feeds[index];
        const rssString = response.data.contents;
        const dataFeed = parse(rssString);
        const updatedFeed = { ...dataFeed, id: actualFeed.id };
        const updatedPosts = updatedFeed.posts;
        const newPosts = _.differenceWith(
          updatedPosts,
          posts,
          (post1, post2) => post1.postTitle === post2.postTitle,
        );
        if (newPosts.length === 0) {
          return;
        }
        const unitedPosts = [...state.posts, ...newPosts];
        const allPostsWithID = unitedPosts.map((post) => {
          const newPostNumber = unitedPosts.indexOf(post);
          return { ...post, postId: `${updatedFeed.id}${newPostNumber}` };
        });
        state.posts = allPostsWithID;
        /* updatedPosts.forEach((updatedPost) => {
          const oldPosts = posts.filter((post) => {
            if (post.postTitle === updatedPost.postTitle
            && post.postLink === updatedPost.postLink) {
              return true;
            }
            return false;
          });
          if (oldPosts.length === 0) {
            const unitedPosts = [...state.posts, updatedPost];
            const allPostsWithID = unitedPosts.map((post) => {
              const newPostNumber = unitedPosts.indexOf(post);
              return { ...post, postId: `${updatedFeed.id}${newPostNumber}` };
            });
            state.posts = allPostsWithID;
          }
        }); */
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
      // feedsUrls: [],
    },
    feeds: [],
    posts: [],
    rssLoading: {
      state: 'initial',
      // feeds: [],
      // posts: [],
      error: null,
    },
    uiState: {
      modal: {
        openedWindowId: null,
        visitedLinks: [],
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
    // const { feedsUrls } = watchedState.formState;
    const { feeds } = watchedState;
    const feedsUrls = feeds.map((feed) => feed.url);
    validate(url, feedsUrls)
      .then(() => {
        watchedState.formState.url = url;
        watchedState.formState.validationError = null;
        // watchedState.formState.feedsUrls.push(checkedUrl);
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
        watchedState.feeds.push(modifiedFeed);
        const unitedPosts = [...watchedState.posts, ...posts];
        const allPostsWithID = unitedPosts.map((post) => {
          const newPostNumber = unitedPosts.indexOf(post);
          return { ...post, postId: `${modifiedFeed.id}${newPostNumber}` };
        });
        watchedState.posts = allPostsWithID;
        watchedState.rssLoading.error = null;
        watchedState.rssLoading.state = 'processed';
      })
      .catch((error) => {
        console.log(error);
        if (_.isObject(error) && error.code) {
          watchedState.rssLoading.state = 'failed';
          watchedState.rssLoading.error = 'netError';
          // watchedState.formState.feedsUrls.pop();
        } else if (error.isParse) {
          watchedState.rssLoading.state = 'failed';
          watchedState.rssLoading.error = 'rssError';
          // watchedState.formState.feedsUrls.pop();
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
    watchedState.uiState.modal.visitedLinks.push(anchorId);
    console.log(watchedState.uiState.modal.visitedLinks);
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
