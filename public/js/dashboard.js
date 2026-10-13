// Put the cursor at the end of the value on focus, instead of the start
document.querySelectorAll('[data-cursor-end]').forEach((input) => {
  input.addEventListener('focus', () => {
    const end = input.value.length;
    input.setSelectionRange(end, end);
  });
});

// Check the file size before uploading, so the user sees the error in the dialog
// right away. Only for UX: the server enforces the same limit with Multer.
const fileInput = document.querySelector('#file-input');

if (fileInput) {
  const fileError = document.querySelector('#file-error');
  const maxSize = Number(fileInput.dataset.maxSize);

  const isTooLarge = () => fileInput.files[0]?.size > maxSize;

  fileInput.addEventListener('change', () => {
    fileError.textContent = isTooLarge()
      ? `File is too large. Max size is ${maxSize / (1024 * 1024)} MB.`
      : '';
    fileError.hidden = !isTooLarge();
  });

  fileInput.form.addEventListener('submit', (event) => {
    if (isTooLarge()) event.preventDefault();
  });
}
