import { Octokit } from "https://cdn.skypack.dev/@octokit/rest"
import axios from 'https://cdn.skypack.dev/axios'

window.addEventListener('load', async function() {
  let editor = ContentTools.EditorApp.get()
  let home = document.getElementById('home')
  let sections = Array.from(document.getElementsByClassName('list-group-item'))
  let sortable

  editor.init('*[data-editable]', 'data-name')
  editor.addEventListener('start', () => {
    // Simple list
    sortable = sortable || Sortable.create(home, {
      handle: '.handle'
    /* options */ })

    sortable.options.sort = true
    sections.forEach(x => x.classList.toggle('draggable'))
  })

  editor.addEventListener('stop', () => {
    sortable.options.sort = false
    sections.forEach(x => x.classList.toggle('draggable'))
  })

  editor.addEventListener('save', saveToGithub)

  feather.replace()
})

async function saveToGithub() {
  let button = document.querySelector(".button-login")
  let modal = document.getElementById("myModal")
  modal.style.display = "block"

  button.addEventListener("click", mergeChanges )
}

async function mergeChanges () {
  const username = document.querySelector("#username").value
  const octokit = new Octokit({auth: document.getElementById("password").value})
  await octokit.request("/user")
    .then(async ( response ) => {
      let modal = document.getElementById("myModal")
      let editor = document.querySelector('.ct-app')
      modal.style.display = "none"
      editor.style.display = "none"

      let lastCommitSha = await lastCommit(octokit)
      let lastTreeSha = await lastTree(octokit, lastCommitSha)
      let url = new URL(window.location.href)
      let newPages = await getNewPages()
      let template = await getNewPagesTemplate()
      let files = [
        ...newPages.map(x => ({ filename: x, content: template })),
        {
          filename: `${url.pathname === '/' ? 'index.html': url.pathname}`,
          content: document.documentElement.innerHTML,
        }
      ]

      let sha = await createTree(octokit,
        files,
        lastTreeSha
      )

      let finalSha = await createCommit(octokit, sha, lastCommitSha)

      updateRef(octokit, finalSha)
        .then(( response ) => {
          alert("Saved your changes refresh to see them")
        })
        .catch(err => alert(err))
    })
    .catch(err => alert(err))
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

async function createTree(octokit, files, lastTree) {
  return new Promise((resolve, reject) => {
    octokit.git.createTree({
      owner:'brock8503',
      repo: 'the_personal_website',
      base_tree: lastTree,
      tree: files.map((x) => {
        return {
          path: `public/${x.filename.replace('/', '')}`,
          mode: '100644',
          type: 'blob',
          content: x.content
        }
      })
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
      parents: [ parent ],
      message: `Web commit\n\nCommit made on ${new Date(Date.now()).toUTCString()}`
    })
    .then(async ( response ) => {
      resolve(response.data.sha)
    })
    .catch(err => alert(err))
  })
}

async function updateRef(octokit, sha) {
  return new Promise((resolve, reject) => {
    octokit.request(`PATCH /repos/brock8503/the_personal_website/git/refs/heads/main`, { data: { sha } })
    .then(( response ) => {
      resolve(response.data)
    })
    .catch(err => alert(err))
  })
}

function getAllPages() {
  // get all a tag's hrefs and return only
  // ones with html tags
  return [...document.querySelectorAll('a')]
    .map(x => x.getAttribute('href'))
    .filter(x => x.includes('.html'))
}

async function getNewPages() {
  return new Promise(async (resolve) => {
    let base = new URL(window.location.href)
    let urls = getAllPages()
    // "GET" urls
    let responses = await Promise
      .all(urls.map(x => axios.get(new URL(x, base.origin), {validateStatus: () => true})))

    // for 404's add file based on predefined template to createTree
    resolve(responses
      .filter(x => x.status === 404)
      .map(x => new URL(x.request.responseURL).pathname)
    )
  })
}

async function getNewPagesTemplate() {
  return new Promise(async (resolve) => {
    let base = new URL(window.location.href)
    let response = await axios.get(new URL('template.html', base.origin))
    resolve(response.data)
  })
}
