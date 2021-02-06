import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";

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

  editor.addEventListener('save', saveToGithub)

  feather.replace();
});

async function saveToGithub() {
  let button = document.querySelector(".button-login");
  let modal = document.getElementById("myModal");
  modal.style.display = "block";

  button.addEventListener("click", async (e) => {
    const username = document.querySelector("#username").value;
    const octokit = new Octokit({auth: document.getElementById("password").value});
    await octokit.request("/user")
      .then(async ( response ) => {
        let lastCommitSha = await lastCommit(octokit);
        let lastTreeSha = await lastTree(octokit, lastCommitSha);
        let url = new URL(window.location.href);
        let sha = await createTree(octokit,
          url.pathname === '/' ? 'index.html': url.pathname,
          document.documentElement.innerHTML,
          lastTreeSha
        );

        let finalSha = await createCommit(octokit, sha, lastCommitSha)

        updateRef(octokit, response.data.sha)
          .then(( response ) => {
            alert("Saved your changes refresh to see them");
          })
          .catch(err => alert(err))
      })
      .catch(err => alert(err))
      .finally(() => { modal.style.display = "none"; })
  })
}

async function lastCommit(octokit) {
  return new Promise((resolve, reject) => {
    octokit.request("/repos/brock8503/the_personal_website/git/refs/heads/main")
      .then(( response ) => {
        resolve(response.data.object.sha)
      })
      .catch(err => alert(err))
  })
}

async function lastTree(octokit, sha) {
  return new Promise((resolve, reject) => {
    octokit.request(`/repos/brock8503/the_personal_website/git/commits/${sha}`)
      .then(( response ) => {
        resolve(response.data.tree.sha)
      })
      .catch(err => alert(err))
  })
}

async function createTree(octokit, filename, content, lastTree) {
  return new Promise((resolve, reject) => {
    octokit.git.createTree({
      owner:'brock8503',
      repo: 'the_personal_website',
      base_tree: lastTree,
      tree: [{ path: `public/${filename}`, mode: '100644', type: 'blob', content: content }]
    })
      .then(( response ) => {
        resolve(response.data.sha)
      })
      .catch(err => alert(err))
  })
}

async function createCommit(octokit, treeSha, parent) {
  return new Promise((resolve, reject) => {
    octokit.git.createCommit({
      owner:'brock8503',
      repo: 'the_personal_website',
      tree: treeSha,
      parent: parent,
      message: `Web commit \n Commit made on ${new Date(Date.now()).toUTCString()}`
    })
      .then(async ( response ) => {
        resolve(response.data.sha)
      })
      .catch(err => alert(err))
  })
}

async function updateRef(octokit, sha) {
  return new Promise((resolve, reject) => {
    octokit.request(`/repos/brock8503/the_personal_website/git/refs/heads/main`, { sha })
    .then(( response ) => {
      resolve(response.data)
    })
    .catch(err => alert(err))
  })
}
