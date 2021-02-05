window.addEventListener('load', function() {
  let editor = ContentTools.EditorApp.get();
  let home = document.getElementById('home');
  let sections = Array.from(document.getElementsByClassName('list-group-item'));
  let sortable;

  editor.init('*[data-editable]', 'data-name');
  editor.addEventListener('start', () => {
    // Simple list
    sortable = sortable || Sortable.create(home, { /* options */ });
    sortable.options.sort = true;
    sections.forEach(x => x.classList.toggle('draggable'))
  })
  editor.addEventListener('stop', () => {
    sortable.options.sort = false;
    sections.forEach(x => x.classList.toggle('draggable'))
  })

  feather.replace();
});
