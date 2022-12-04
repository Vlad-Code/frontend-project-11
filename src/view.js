import onChange from 'on-change';

const watchState = (state) => onChange(state, (path, value) => {
  if (path === 'rssForm.valid') {
    const input = document.querySelector('#url-input');
    if (value === false) {
      input.classList.add('is-invalid');
    } else if (value === true) {
      input.classList.remove('is-invalid');
    }
  }
});

export default watchState;
