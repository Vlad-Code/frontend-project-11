import onChange from 'on-change';

const watchState = (state, i18nextInstance) => onChange(state, (path, value) => {
  if (path === 'rssForm.valid') {
    const input = document.querySelector('#url-input');
    if (value === false) {
      input.classList.add('is-invalid');
    } else if (value === true) {
      input.classList.remove('is-invalid');
    }
  }
  if (path === 'rssForm.validationError') {
    const feedback = document.querySelector('.feedback');
    if (value === null) {
      feedback.textContent = '';
    } else if (value[0] === 'this must be a valid URL') {
      console.log('yes');
      feedback.textContent = i18nextInstance.t('validationErrorNotURL');
    } else {
      feedback.textContent = i18nextInstance.t('validationErrorExistedURL');
    }
  }
});

export default watchState;
