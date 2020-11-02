export default class UploadAdapter {

  constructor(loader, owner, context) {
    this.loader = loader;
    this.owner = owner;
    this.context = context
  }

  async upload() {
    return await this.owner.upload({loader: this.loader, ...this.context});
  }

}