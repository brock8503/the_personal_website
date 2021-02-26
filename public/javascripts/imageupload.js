export default class ImageUploader {
  IMAGEPATH = 'image.png'
  IMAGESIZE = [600, 174]

  constructor(dialog) {
    this._dialog = dialog
    this._dialog.addEventListener('cancel', this.onCancel.bind(this))
    this._dialog.addEventListener('imageuploader.cancelupload', this.onCancelUpload.bind(this))
    this._dialog.addEventListener('imageuploader.clear', this.onClear.bind(this))
    this._dialog.addEventListener('imageuploader.fileready', this.onFileReady.bind(this))
    this._dialog.addEventListener('imageuploader.mount', this.onMount.bind(this))
    this._dialog.addEventListener('imageuploader.unmount', this.onUnmount.bind(this))
    this._dialog.addEventListener('imageuploader.rotateccw', this.onRotateCCW.bind(this))
    this._dialog.addEventListener('imageuploader.rotatecw', this.onRotateCW.bind(this))
    this._dialog.addEventListener('imageuploader.save', this.onSave.bind(this))
  }

  onCancel () {}

  onCancelUpload () {
    clearTimeout(this._uploadingTimeout);
    this._dialog.state('empty')
  }

  onClear () {
    this._dialog.clear()
  }

  onFileReady (file) {
    let upload
    console.log(file)
    this._dialog.progress(0)
    this._dialog.state('uploading')
    upload = () => {
      let progress
      progress = this._dialog.progress()
      progress += 1

      if (progress <= 100) {
        this._dialog.progress(progress)
        return this._uploadingTimeout = setTimeout(upload, 25)
      } else {
        return this._dialog.populate(this.IMAGEPATH, this.IMAGESIZE)
      }
    }
    return this._uploadingTimeout = setTimeout(upload, 25)
  }

  onMount () {}
  onUnmount () {}

  onRotateCCW () {
    let clearBusy;
    this._dialog.busy(true);
    setTimeout(() => this._dialog.busy(false), 1500);
  }

  onRotateCW () {
    let clearBusy;
    this._dialog.busy(true);
    setTimeout(() => this._dialog.busy(false), 1500);
  }

  onSave () {
    let clearBusy;
    this._dialog.busy(true);
    setTimeout(() => {
        this._dialog.busy(false)
        this._dialog.save(this.IMAGEPATH, this.IMAGESIZE)
      }, 1500);
  }
}
