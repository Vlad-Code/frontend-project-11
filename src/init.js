/* eslint-disable no-param-reassign */
import 'bootstrap';
import * as yup from 'yup';
import 'bootstrap/dist/css/bootstrap.min.css';
import i18next from 'i18next';
import axios from 'axios';
import watchState from './view.js';
import resources from './locales/index.js';
import buildData from './parse.js';

const parse = (response) => {
  const stringXML = response.data.contents;
  const parser = new DOMParser();
  const doc = parser.parseFromString(stringXML, 'application/xml');
  return doc;
};

const request = (watchedState) => {
  if (watchedState.rssLoading.state === 'failed') {
    return;
  }
  const { feeds } = watchedState.rssLoading;
  const { posts } = watchedState.rssLoading;
  feeds.forEach((feed) => {
    const url = feed.feedUrl;
    const { id } = feed;
    const myUrl = new URL('https://allorigins.hexlet.app/');
    myUrl.pathname = '/get';
    myUrl.search = `?disableCache=true&url=${encodeURIComponent(`${url}`)}`;
    axios.get(myUrl)
      .then((response) => {
        const rssDocument = parse(response);
        const items = rssDocument.querySelectorAll('item');
        items.forEach((item) => {
          const itemTitle = item.querySelector('title').textContent;
          const itemLink = item.querySelector('link').textContent;
          const itemDescription = item.querySelector('description').textContent;
          const itemId = id;
          const newItem = {
            itemTitle, itemLink, itemId, itemDescription,
          };
          const newPost = posts.filter((post) => {
            if (post.itemTitle === newItem.itemTitle && post.itemLink === newItem.itemLink) {
              return true;
            }
            return false;
          });
          if (newPost.length === 0) {
            watchedState.rssLoading.posts.push(newItem);
          }
        });
        watchedState.rssLoading.state = 'processed';
        watchedState.rssLoading.state = 'ready for loading';
      })
      .catch((networkErr) => {
        watchedState.rssLoading.state = 'failed';
        watchedState.rssLoading.error = networkErr.code;
      });
  });
  setTimeout(request, 5000, watchedState);
};

const app = (i18nextInstance) => {
  const initialState = {
    formRegistration: {
      language: 'ru',
      url: null,
      valid: true,
      validationError: null,
      feeds: [],
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
  const validate = (url, feeds) => {
    const schema = yup.string().trim().required().url()
      .notOneOf(feeds);
    return schema.validate(url, { abortEarly: false });
  };
  const form = document.querySelector('.rss-form');
  const input = form.elements.url;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    watchedState.formRegistration.url = url;
    const { feeds } = watchedState.formRegistration;
    validate(url, feeds)
      .then((data) => {
        watchedState.formRegistration.valid = true;
        watchedState.formRegistration.validationError = null;
        watchedState.formRegistration.feeds.push(data);
        form.reset();
        input.focus();
        const myUrl = new URL('https://allorigins.hexlet.app/');
        myUrl.pathname = '/get';
        myUrl.search = `?disableCache=true&url=${encodeURIComponent(`${watchedState.formRegistration.url}`)}`;
        watchedState.rssLoading.state = 'loading';
        axios.get(myUrl)
          .then((response) => {
            buildData(response, watchedState);
          })
          .catch((networkErr) => {
            watchedState.rssLoading.state = 'failed';
            watchedState.rssLoading.error = networkErr.code;
          });
      })
      .then(() => {
        watchedState.rssLoading.state = 'ready for loading';
        setTimeout(request, 5000, watchedState);
      })
      .catch((error) => {
        const [errorType] = error.errors;
        watchedState.formRegistration.valid = false;
        watchedState.formRegistration.validationError = errorType;
        form.reset();
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
