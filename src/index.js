import 'bootstrap';
import _ from 'lodash';
import * as yup from 'yup';
import 'bootstrap/dist/css/bootstrap.min.css';
import watchState from './view.js';

const schema = yup.string().url();

const validate = (url) => schema.validate(url, { abortEarly: false })
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

app();

console.log('Hello World!');
