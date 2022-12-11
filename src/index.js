import 'bootstrap';
import _ from 'lodash';
import * as yup from 'yup';
import 'bootstrap/dist/css/bootstrap.min.css';
import i18next from 'i18next';
import watchState from './view.js';
import ru from './ru.js';

const app = (i18nextInstance) => {
  const state = {
    rssForm: {
      url: null,
      valid: true,
      validationError: null,
      feeds: [],
    },
  };
  let schema = yup.string().trim().required().url()
    .notOneOf([]);
  const validate = (url) => schema.validate(url, { abortEarly: false });
  const watchedState = watchState(state, i18nextInstance);
  const form = document.querySelector('.rss-form');
  const input = form.elements.url;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    watchedState.rssForm.url = url;
    validate(url)
      .then((data) => {
        watchedState.rssForm.valid = true;
        watchedState.rssForm.validationError = null;
        state.rssForm.feeds.push(data);
        schema = yup.string().trim().required().url()
          .notOneOf(state.rssForm.feeds);
        form.reset();
        input.focus();
      })
      .catch((error) => {
        watchedState.rssForm.valid = false;
        watchedState.rssForm.validationError = error.errors;
        form.reset();
        input.focus();
      });
    console.log(state);
  });
};

const runApp = () => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru,
    },
  }).then(() => app(i18nextInstance));
};

runApp();

console.log('Hello World!');
