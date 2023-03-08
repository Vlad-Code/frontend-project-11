import onChange from 'on-change';

const renderLoading = (value) => {
  const form = document.querySelector('.rss-form');
  const input = form.elements.url;
  const button = document.querySelector('button[type="submit"]');
  if (value === 'loading') {
    input.disabled = true;
    button.disabled = true;
  } else if (value === 'processed' || value === 'failed') {
    input.disabled = false;
    button.disabled = false;
  }
};

/* const renderFeedbackValidation = (error, i18nextInstance) => {
  const feedback = document.querySelector('.feedback');
  const form = document.querySelector('.rss-form');
  const input = form.elements.url;
  if (error === null) {
    feedback.textContent = '';
    input.classList.remove('is-invalid');
  } else if (error === 'this must be a valid URL') {
    input.classList.add('is-invalid');
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
    feedback.textContent = i18nextInstance.t('validationErrorNotURL');
  } else {
    input.classList.add('is-invalid');
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
    feedback.textContent = i18nextInstance.t('validationErrorExistedURL');
  }
  input.focus();
}; */

/* const renderFeedbackLoading = (error, i18nextInstance) => {
  const feedback = document.querySelector('.feedback');
  const form = document.querySelector('.rss-form');
  const input = form.elements.url;
  if (error === null) {
    feedback.classList.remove('text-danger');
    feedback.classList.add('text-success');
    feedback.textContent = i18nextInstance.t('loadingSuccess');
    input.classList.remove('is-invalid');
    form.reset();
  } else if (error === 'ERR_CONTENT') {
    input.classList.add('is-invalid');
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
    feedback.textContent = i18nextInstance.t('rssError');
  } else if (error === 'ERR_NETWORK') {
    input.classList.add('is-invalid');
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
    feedback.textContent = i18nextInstance.t('netError');
  }
  input.focus();
}; */

const renderFeedback = (error, i18nextInstance) => {
  const feedback = document.querySelector('.feedback');
  const form = document.querySelector('.rss-form');
  const input = form.elements.url;
  if (error === null) {
    feedback.classList.remove('text-danger');
    feedback.classList.add('text-success');
    feedback.textContent = i18nextInstance.t('loadingSuccess');
    input.classList.remove('is-invalid');
    form.reset();
  } else {
    input.classList.add('is-invalid');
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
    feedback.textContent = i18nextInstance.t(error);
  }
  input.focus();
};

const renderFeed = (feedsFromState, i18nextInstance) => {
  const feeds = document.querySelector('.feeds');
  feeds.innerHTML = '';
  const container = document.createElement('div');
  container.classList.add('card', 'border-0');
  feeds.append(container);
  const highlightContainer = document.createElement('div');
  highlightContainer.classList.add('card-body');
  container.append(highlightContainer);
  const highlight = document.createElement('h2');
  highlight.classList.add('card-title', 'h4');
  highlightContainer.append(highlight);
  highlight.textContent = i18nextInstance.t('feeds');
  const feedsList = document.createElement('ul');
  feedsList.classList.add('list-group-item', 'border-0', 'border-end-0');
  container.append(feedsList);
  feedsFromState.forEach((feed) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');
    feedsList.append(li);
    const title = document.createElement('h3');
    title.classList.add('h6', 'm-0');
    li.append(title);
    title.textContent = feed.title;
    const description = document.createElement('p');
    description.classList.add('m-0', 'small', 'text-black-50');
    li.append(description);
    description.textContent = feed.description;
  });
};

const renderPost = (posts, watchedState, i18nextInstance) => {
  const postElement = document.querySelector('.posts');
  postElement.innerHTML = '';
  const container = document.createElement('div');
  container.classList.add('card', 'border-0');
  postElement.append(container);
  const highlightContainer = document.createElement('div');
  highlightContainer.classList.add('card-body');
  container.append(highlightContainer);
  const highlight = document.createElement('h2');
  highlight.classList.add('card-title', 'h4');
  highlightContainer.append(highlight);
  highlight.textContent = i18nextInstance.t('posts');
  const postsList = document.createElement('ul');
  postsList.classList.add('list-group-item', 'border-0', 'border-end-0');
  container.append(postsList);
  posts.forEach((post) => {
    const { postId } = post;
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    postsList.append(li);
    const anchor = document.createElement('a');
    if (!watchedState.uiState.modal.readingState.includes(postId)) {
      anchor.classList.add('fw-bold');
    }
    anchor.setAttribute('href', post.postLink);
    anchor.setAttribute('data-id', postId);
    anchor.setAttribute('target', '_blank');
    anchor.setAttribute('rel', 'noopener noreferrer');
    li.append(anchor);
    anchor.textContent = post.postTitle;
    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.setAttribute('data-id', postId);
    button.textContent = i18nextInstance.t('modalButton');
    li.append(button);
  });
};

const renderModal = (id, watchedState) => {
  const postAnchor = document.querySelector(`a[data-id="${id}"]`);
  postAnchor.classList.remove('fw-bold');
  postAnchor.classList.add('fw-normal');
  const myModal = document.querySelector('#modal');
  const title = postAnchor.textContent;
  const modalTitle = myModal.querySelector('.modal-title');
  modalTitle.textContent = title;
  const { posts } = watchedState.rssLoading;
  const ourPost = posts.filter((post) => post.postId === id)[0];
  const { postDescription } = ourPost;
  const modalBody = myModal.querySelector('.modal-body');
  modalBody.textContent = postDescription;
  const readButton = myModal.querySelector('[target="_blank"]');
  const { postLink } = ourPost;
  readButton.setAttribute('href', postLink);
};

/* const watchState = (state, i18nextInstance) => onChange(state, (path, value) => {
  if (path === 'formState.validationError') {
    renderFeedback(value, i18nextInstance);
  }
  if (path === 'rssLoading.state') {
    if (value === 'failed' || value === 'loading') {
      renderLoading(value);
    }
    if (value === 'processed') {
      renderLoading(value);
      renderFeedback(state.rssLoading.error, i18nextInstance);
      renderFeed(state.rssLoading.feeds, i18nextInstance);
      renderPost(state.rssLoading.posts, state, i18nextInstance);
    }
  }
  if (path === 'rssLoading.error') {
    renderFeedback(value, i18nextInstance);
  }
  if (path === 'uiState.modal.openedWindowId') {
    renderModal(value, state);
  }
  if (path === 'automaticallyLoading.state') {
    if (value === 'processed') {
      renderPost(state.rssLoading.posts, state, i18nextInstance);
    }
  }
}); */

const watchState = (state, i18nextInstance) => onChange(state, (path, value) => {
  switch (path) {
    case 'formState.validationError':
      renderFeedback(value, i18nextInstance);
      break;
    case 'rssLoading.state':
      renderLoading(value);
      renderFeedback(state.rssLoading.error, i18nextInstance);
      break;
    case 'rssLoading.feeds':
      renderFeed(value, i18nextInstance);
      break;
    case 'rssLoading.posts':
      renderPost(value, state, i18nextInstance);
      break;
    case 'rssLoading.error':
      renderFeedback(value, i18nextInstance);
      break;
    case 'uiState.modal.openedWindowId':
      renderModal(value, state);
      break;
    default:
      console.log('Other change of the state');
      break;
  }
});

export default watchState;
