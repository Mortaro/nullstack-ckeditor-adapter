import Nullstack from 'nullstack';
import UploadAdapter from './UploadAdapter';

class CKEditor extends Nullstack {

  editor = null;

  static async persist({base64, ckeditor}) {
    const {existsSync, mkdirSync} = await import('fs');
    const {default: Jimp} = await import('jimp');
    const width = ckeditor && ckeditor.imagesWidth ? ckeditor.imagesWidth : Jimp.AUTO;
    const height = ckeditor && ckeditor.imagesHeight ? ckeditor.imagesHeight : Jimp.AUTO;
    const quality = ckeditor && ckeditor.imagesQuality ? ckeditor.imagesQuality : 100;
    const folder = ckeditor && ckeditor.uploadFolder ? ckeditor.uploadFolder : 'public/uploads';
    let image = await Jimp.read(Buffer.from(base64, 'base64'));
    if (!existsSync(folder)) {
      mkdirSync(folder);
    }
    const key = `${folder}/${new Date().getTime()}.jpg`;
    if(quality || width || height) {
      image.resize(width || Jimp.AUTO, height || Jimp.AUTO).quality(quality || 100).write(key);
    } else {
      image.write(key);
    }
    return key.replace('public', '');
  }

  upload({loader}) {
    return new Promise((resolve) => {
      loader.file.then((file) => {
        const reader = new FileReader();
        reader.readAsBinaryString(file);
        reader.onload = async () => {
          const base64 = btoa(reader.result);
          const value = await this.persist({base64});
          loader.uploaded = true;
          resolve({default: value});
        };
      });
    });
  }

  generateUploadAdapter(context) {
    const owner = this;
    return function(editor) {
      editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
        return new UploadAdapter(loader, owner, context);
      };
    }
  }

  importScript(src) {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.async = true;
      script.onload = resolve;
      document.querySelector('head').appendChild(script);
    });
  }

  async initiate(context) {
    const {environment, language, name, onchange} = context;
    if(environment.client) {
      if(typeof(ClassicEditor) == 'undefined') {
        if(language) {
          await this.importScript(`https://cdn.ckeditor.com/ckeditor5/23.0.0/classic/translations/${language}.js`);
        }
        await this.importScript(`https://cdn.ckeditor.com/ckeditor5/23.0.0/classic/ckeditor.js`);
      }
      const selector = document.querySelector(`[name="${name}"]`);
      const options = {
        language: language || 'en',
        extraPlugins: [this.generateUploadAdapter(context)]
      }
      this.editor = await ClassicEditor.create(selector, options);
      this.editor.model.document.on('change:data', () => {
        const value = this.editor.getData();
        onchange && onchange({value});
      });
      
    }
  }

  update({value}) {
    if(this.editor && this.editor.getData() !== value) {
      this.editor.setData(value);
    }
  }

  async terminate() {
    if(this.editor) {
      this.editor.destroy();
    }
  }
  
  render({name, value, class: klass}) {
    return (
      <div>
        <textarea class={klass} name={name}>{value}</textarea>
      </div>
    )
  }

}

export default CKEditor;