// Put the cursor at the end of the value on focus, instead of the start
document.querySelectorAll('[data-cursor-end]').forEach((input) => {
  input.addEventListener('focus', () => {
    const end = input.value.length;
    input.setSelectionRange(end, end);
  });
});
