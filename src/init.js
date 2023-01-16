/* eslint-disable no-param-reassign */
import 'bootstrap';
import _ from 'lodash';
import * as yup from 'yup';
import 'bootstrap/dist/css/bootstrap.min.css';
import i18next from 'i18next';
import axios from 'axios';
import watchState from './view.js';
import ru from './ru.js';

const parse = (string) => {
  const parser = new DOMParser();
  const content = parser.parseFromString(string, 'application/xml');
  return content;
};

const request = (watchedState) => {
  if (watchedState.rssLoading.state === 'failed') {
    return;
  }
  console.log('time');
  const { feeds } = watchedState.rssLoading;
  const { posts } = watchedState.rssLoading;
  feeds.forEach((feed) => {
    const url = feed.feedUrl;
    const { id } = feed;
    axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(`${url}`)}`)
      .then((response) => {
        const stringXML = response.data.contents;
        const rssDocument = parse(stringXML);
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
          console.log(newPost);
          if (newPost.length === 0) {
            watchedState.rssLoading.posts.push(newItem);
          }
        });
        watchedState.rssLoading.state = 'processed';
        watchedState.rssLoading.state = 'initial';
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
      url: null,
      valid: true,
      validationError: null,
      feeds: [],
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
  let schema = yup.string().trim().required().url()
    .notOneOf([]);
  const validate = (url) => schema.validate(url, { abortEarly: false });
  const watchedState = watchState(initialState, i18nextInstance);
  const form = document.querySelector('.rss-form');
  const input = form.elements.url;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    watchedState.formRegistration.url = url;
    validate(url)
      .then((data) => {
        watchedState.formRegistration.valid = true;
        watchedState.formRegistration.validationError = null;
        watchedState.formRegistration.feeds.push(data);
        schema = yup.string().trim().required().url()
          .notOneOf(watchedState.formRegistration.feeds);
        form.reset();
        input.focus();
        axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(`${watchedState.formRegistration.url}`)}`)
          .then((response) => {
            const contentType = response.data.status.content_type;
            console.log(contentType);
            if (contentType !== 'application/rss+xml; charset=utf-8') {
              watchedState.rssLoading.state = 'failed';
              watchedState.rssLoading.error = 'ERR_CONTENT';
              watchedState.formRegistration.feeds.pop();
              return;
            }
            const stringXML = response.data.contents;
            const rssDocument = parse(stringXML);
            const feedTitle = rssDocument.querySelector('title').textContent;
            const feedDescription = rssDocument.querySelector('description').textContent;
            const feedUrl = watchedState.formRegistration.url;
            const newFeed = {
              feedTitle, feedDescription, id: _.uniqueId(), feedUrl,
            };
            watchedState.rssLoading.feeds.push(newFeed);
            watchedState.rssLoading.error = null;
            const items = rssDocument.querySelectorAll('item');
            items.forEach((item) => {
              const itemTitle = item.querySelector('title').textContent;
              const itemLink = item.querySelector('link').textContent;
              const itemDescription = item.querySelector('description').textContent;
              const itemId = newFeed.id;
              const newItem = {
                itemTitle, itemLink, itemId, itemDescription,
              };
              watchedState.rssLoading.posts.push(newItem);
            });
            watchedState.rssLoading.state = 'processed';
            watchedState.rssLoading.state = 'initial';
          })
          .catch((networkErr) => {
            watchedState.rssLoading.state = 'failed';
            watchedState.rssLoading.error = networkErr.code;
            console.log(watchedState.rssLoading);
          });
      })
      .then(() => {
        setTimeout(request, 5000, watchedState);
      })
      .catch((error) => {
        const [errorType] = error.errors;
        watchedState.formRegistration.valid = false;
        watchedState.formRegistration.validationError = errorType;
        form.reset();
        input.focus();
        console.log(watchedState.formRegistration.validationError);
      });
  });
  const myModal = document.querySelector('#modal');
  myModal.addEventListener('shown.bs.modal', (event) => {
    console.log('modal is working');
    const button = event.relatedTarget;
    const anchor = button.previousElementSibling;
    const anchorId = anchor.getAttribute('data-id');
    watchedState.uiState.modal.openedWindowId = anchorId;
    watchedState.uiState.modal.readingState.push(Number(anchorId));
    console.log(watchedState.uiState.modal);
  });
};

export default () => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru,
    },
  }).then(() => app(i18nextInstance));
};
