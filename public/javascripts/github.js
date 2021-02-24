import { Octokit } from "https://cdn.skypack.dev/@octokit/rest"

export default class Github {
  async init({ password = '' } = {}) {
    this.octokit = new Octokit({auth: password})
    this.user = (await this.octokit.request("/user")).data
    return this
  }

  async lastCommit() {
    return new Promise((resolve, reject) => {
      this.octokit.request(`/repos/${this.user.login}/the_personal_website/git/refs/heads/main`)
        .then(( response ) => {
          resolve(response.data.object.sha)
        })
        .catch(err => alert(err))
    })
  }

  async lastTree(sha) {
    return new Promise((resolve, reject) => {
      this.octokit.request(`/repos/${this.user.login}/the_personal_website/git/commits/${sha}`)
        .then(( response ) => {
          resolve(response.data.tree.sha)
        })
        .catch(err => alert(err))
    })
  }

  async createTree(files, lastTree) {
    return new Promise((resolve, reject) => {
      this.octokit.git.createTree({
        owner: this.user.login,
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

  async createCommit(treeSha, parent) {
    return new Promise((resolve, reject) => {
      this.octokit.git.createCommit({
        owner: this.user.login,
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

  async updateRef(sha) {
    return new Promise((resolve, reject) => {
      this.octokit.request(`PATCH /repos/${this.user.login}/the_personal_website/git/refs/heads/main`, { data: { sha } })
      .then(( response ) => {
        resolve(response.data)
      })
      .catch(err => alert(err))
    })
  }
}

