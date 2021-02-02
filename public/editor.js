window.addEventListener('load', function() {
  let editor= ContentTools.EditorApp.get();
  editor.init('*[data-editable]', 'data-name');
  feather.replace();
});
