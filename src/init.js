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

const getUrl = (url) => {
  const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', 'true');
  return urlWithProxy.toString();
};

const repeatingRequest = (watchedState) => {
  watchedState.rssLoading.state = 'ready for loading';
  const { feeds, posts } = watchedState.rssLoading;
  feeds.forEach((feed) => {
    const url = feed.feedUrl;
    const myUrl = getUrl(url);
    axios.get(myUrl)
      .then((response) => {
        const rssString = response.data.contents;
        const feedAndPosts = parse(rssString);
        const checkingPosts = feedAndPosts.posts;
        checkingPosts.forEach((checkingPost) => {
          const oldPosts = posts.filter((post) => {
            if (post.postTitle === checkingPost.postTitle
              && post.postLink === checkingPost.postLink) {
              return true;
            }
            return false;
          });
          if (oldPosts.length === 0) {
            watchedState.rssLoading.posts.push(checkingPost);
          }
        });
        watchedState.rssLoading.state = 'processed';
      })
      .catch((networkErr) => {
        watchedState.rssLoading.state = 'failed';
        watchedState.rssLoading.error = networkErr.code;
      });
  });
  setTimeout(repeatingRequest, 5000, watchedState);
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
      state: 'ready for loading',
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
  const input = form.elements.url;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    watchedState.formState.url = url;
    const myUrl = getUrl(url);
    const { feedsUrls } = watchedState.formState;
    validate(url, feedsUrls)
      .then((checkedUrl) => {
        watchedState.formState.valid = true;
        watchedState.formState.validationError = null;
        watchedState.formState.feedsUrls.push(checkedUrl);
        form.reset();
        input.focus();
        watchedState.rssLoading.state = 'loading';
      })
      .then(() => axios.get(myUrl))
      .then((response) => {
        const rssString = response.data.contents;
        const feedAndPosts = parse(rssString);
        const { feed, posts } = feedAndPosts;
        if (feed === null && posts.length === 0) {
          watchedState.rssLoading.state = 'failed';
          watchedState.rssLoading.error = 'ERR_CONTENT';
          watchedState.formState.feedsUrls.pop();
          throw new Error('Not a rss!');
        } else {
          feed.feedUrl = watchedState.formState.url;
          watchedState.rssLoading.feeds.push(feed);
          watchedState.rssLoading.posts = [...posts];
          watchedState.rssLoading.state = 'processed';
        }
      })
      .then(() => {
        watchedState.rssLoading.state = 'ready for loading';
        setTimeout(repeatingRequest, 5000, watchedState);
      })
      .catch((error) => {
        console.log(error);
        if (_.isObject(error) && error.code) {
          watchedState.rssLoading.state = 'failed';
          watchedState.rssLoading.error = error.code;
        } else if (_.isObject(error) && error.errors) {
          const [errorType] = error.errors;
          watchedState.formState.valid = false;
          watchedState.formState.validationError = errorType;
        } else if (error === 'Error: Not a rss!') {
          watchedState.rssLoading.state = 'failed';
          watchedState.rssLoading.error = 'ERR_CONTENT';
          watchedState.formState.feedsUrls.pop();
        }
        input.focus();
      });
  });
  const myModal = document.querySelector('#modal');
  myModal.addEventListener('shown.bs.modal', (event) => {
    const buttonModal = event.relatedTarget;
    const anchor = buttonModal.previousElementSibling;
    const anchorId = anchor.getAttribute('data-id');
    watchedState.uiState.modal.openedWindowId = anchorId;
    watchedState.uiState.modal.readingState.push(Number(anchorId));
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
