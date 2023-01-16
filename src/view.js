import onChange from 'on-change';

const renderFeedbackValidation = (error, i18nextInstance) => {
  const feedback = document.querySelector('.feedback');
  if (error === null) {
    feedback.textContent = '';
  } else if (error === 'this must be a valid URL') {
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
    feedback.textContent = i18nextInstance.t('validationErrorNotURL');
  } else {
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
    feedback.textContent = i18nextInstance.t('validationErrorExistedURL');
  }
};

const renderFeedbackLoading = (error, i18nextInstance) => {
  const feedback = document.querySelector('.feedback');
  if (error === null) {
    feedback.classList.remove('text-danger');
    feedback.classList.add('text-success');
    feedback.textContent = 'RSS успешно загружен';
  } else if (error === 'ERR_CONTENT') {
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
    feedback.textContent = i18nextInstance.t('rssError');
  } else if (error === 'ERR_NETWORK') {
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
    feedback.textContent = i18nextInstance.t('netError');
  }
};

const renderFeed = (value) => {
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
  highlight.textContent = 'Фиды';
  const feedsList = document.createElement('ul');
  feedsList.classList.add('list-group-item', 'border-0', 'border-end-0');
  container.append(feedsList);
  value.forEach((element) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');
    feedsList.append(li);
    const title = document.createElement('h3');
    title.classList.add('h6', 'm-0');
    li.append(title);
    title.textContent = element.feedTitle;
    const description = document.createElement('p');
    description.classList.add('m-0', 'small', 'text-black-50');
    li.append(description);
    description.textContent = element.feedDescription;
  });
};

const renderPost = (posts, watchedState) => {
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
  highlight.textContent = 'Посты';
  const postsList = document.createElement('ul');
  postsList.classList.add('list-group-item', 'border-0', 'border-end-0');
  container.append(postsList);
  posts.forEach((post) => {
    const itemId = posts.indexOf(post);
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    postsList.append(li);
    const anchor = document.createElement('a');
    if (!watchedState.uiState.modal.readingState.includes(itemId)) {
      anchor.classList.add('fw-bold');
    }
    anchor.setAttribute('href', post.itemLink);
    anchor.setAttribute('data-id', itemId);
    anchor.setAttribute('target', '_blank');
    anchor.setAttribute('rel', 'noopener noreferrer');
    li.append(anchor);
    anchor.textContent = post.itemTitle;
    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.setAttribute('data-id', post.itemId);
    button.textContent = 'Просмотр';
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
  const post = watchedState.rssLoading.posts[id];
  const postDescription = post.itemDescription;
  const modalBody = myModal.querySelector('.modal-body');
  modalBody.textContent = postDescription;
  const readButton = myModal.querySelector('[target="_blank"]');
  const postLink = post.itemLink;
  readButton.setAttribute('href', postLink);
};

const watchState = (state, i18nextInstance) => onChange(state, (path, value) => {
  if (path === 'formRegistration.valid') {
    const input = document.querySelector('#url-input');
    if (value === false) {
      input.classList.add('is-invalid');
    } else if (value === true) {
      input.classList.remove('is-invalid');
    }
  }
  if (path === 'formRegistration.validationError') {
    renderFeedbackValidation(value, i18nextInstance);
  }
  if (path === 'rssLoading.state') {
    if (value === 'processed') {
      console.log('yes');
      renderFeedbackLoading(null, i18nextInstance);
      renderFeed(state.rssLoading.feeds);
      renderPost(state.rssLoading.posts, state);
    }
  }
  if (path === 'rssLoading.error') {
    renderFeedbackLoading(value, i18nextInstance);
  }
  if (path === 'uiState.modal.openedWindowId') {
    renderModal(value, state);
  }
});

export default watchState;
