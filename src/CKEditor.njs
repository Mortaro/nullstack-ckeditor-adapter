import Nullstack from 'nullstack';
import UploadAdapter from './UploadAdapter';

class CKEditor extends Nullstack {

  editor = null;
  loaded = false;

  static async persist({ckeditor, base64, name}) {
    const {existsSync, mkdirSync} = await import('fs');
    const {default: Jimp} = await import('jimp');
    const folder = ckeditor && ckeditor.uploadFolder ? ckeditor.uploadFolder : 'public/uploads';
    let image = await Jimp.read(Buffer.from(base64, 'base64'));
    if (!existsSync(folder)) {
      mkdirSync(folder);
    }
    const key = `${folder}/${new Date().getTime()}-${name}.jpg`;
    if(ckeditor && ckeditor.imagesWidth) {
      image = image.resize(ckeditor.imagesWidth, ckeditor.imagesHeight || Jimp.AUTO);
    } else if(ckeditor && ckeditor.imagesHeight) {
      image = image.resize(ckeditor.imagesWidth || Jimp.AUTO, ckeditor.imagesHeight);
    }
    if(ckeditor && ckeditor.imagesQuality) {
      image = image.quality(ckeditor.imagesQuality);
    }
    image.write(key);
    return key.replace('public', '');
  }

  upload({loader}) {
    return new Promise((resolve) => {
      loader.file.then((file) => {
        const reader = new FileReader();
        reader.readAsBinaryString(file);
        reader.onload = async () => {
          const base64 = btoa(reader.result);
          const name = file.name;
          const value = await this.persist({base64, name});
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

  importScript({source}) {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = source;
      script.async = true;
      script.onload = resolve;
      document.querySelector('head').appendChild(script);
    });
  }

  async initiate() {
    await this.update();
  }

  async update({environment, language, name, onchange, value}) {
    if(environment.client && !this.loaded) {
      this.loaded = true;
      if(typeof(ClassicEditor) == 'undefined') {
        if(language) {
          await this.importScript({source: `https://cdn.ckeditor.com/ckeditor5/23.0.0/classic/translations/${language}.js`});
        }
        await this.importScript({source: 'https://cdn.ckeditor.com/ckeditor5/23.0.0/classic/ckeditor.js'});
      }
      const selector = document.querySelector(`[name="${name}"]`);
      const options = {
        language: language || 'en',
        extraPlugins: [this.generateUploadAdapter()]
      }
      this.editor = await ClassicEditor.create(selector, options);
      this.editor.model.document.on('change:data', () => {
        const value = this.editor.getData();
        onchange && onchange({value});
      });
    }
    if(this.editor && this.editor.getData() !== value) {
      this.editor.setData(value);
    }
  }

  async terminate() {
    if(this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
  }
  
  render({name, class: klass}) {
    return (
      <div>
        <textarea class={klass} name={name}></textarea>
      </div>
    )
  }

}

export default CKEditor;