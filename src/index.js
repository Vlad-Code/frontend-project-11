import 'bootstrap';
import _ from 'lodash';
import * as yup from 'yup';
import 'bootstrap/dist/css/bootstrap.min.css';
import i18next from 'i18next';
import watchState from './view.js';
import ru from './ru.js';

const schema = yup.string().url();

const validate = (url) => schema.validate(url, { abortEarly: false });
  /*.then((data) => data)
  .catch((e) => e);*/

const app = () => {
  const state = {
    rssForm: {
      valid: true,
      validationErrors: {},
      feeds: [],
    },
  };
  i18next.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru,
    },
  }).then(() => {
    const header = document.querySelector('.display-3');
    console.log(header);
    header.textContent = i18next.t('headerOne');
  });
  //const header = document.querySelector('.display-3');
  //header.textContent = i18next.t('headerOne');
  const watchedState = watchState(state);
  const form = document.querySelector('.rss-form');
  const input = form.elements.url;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    validate(url)
      .then((data) => {
        console.log(data);
        if (!state.rssForm.feeds.includes(data)) {
          watchedState.rssForm.valid = true;
          watchedState.rssForm.validationErrors = {};
          state.rssForm.feeds.push(data);
          form.reset();
          input.focus();
        } else {
          watchedState.rssForm.valid = false;
          watchedState.rssForm.validationErrors.error = 'RSS уже существует';
          form.reset();
          input.focus();
        }
      })
      .catch((error) => {
        watchedState.rssForm.valid = false;
        watchedState.rssForm.validationErrors.error = error;
        form.reset();
        input.focus();
      });
    console.log(state);
  });
};

/*const runApp = () => {
  const i18nextInstance = i18next.createInstance();
  const i18nextPromise = i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru,
    },
  });
  app(i18nextPromise);
};*/

/*const runApp = async () => {
  const i18nextInstance = i18next.createInstance();
  await i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru,
    },
  });
  app(i18nextInstance);
};*/

//runApp();
app();

console.log('Hello World!');
