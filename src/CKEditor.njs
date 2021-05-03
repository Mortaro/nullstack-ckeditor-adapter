import Nullstack from 'nullstack';
import UploadAdapter from './UploadAdapter';

const editors = {}

class CKEditor extends Nullstack {

  editor = null;

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

  async hydrate({page, language, onchange, value, self}) {
    const translation = (language || page.locale || '').toLowerCase();
    if(typeof(ClassicEditor) == 'undefined') {
      if(translation) {
        await this.importScript({source: `https://cdn.ckeditor.com/ckeditor5/23.0.0/classic/translations/${translation}.js`});
      }
      await this.importScript({source: 'https://cdn.ckeditor.com/ckeditor5/23.0.0/classic/ckeditor.js'});
    }
    const selector = self.element.querySelector('textarea');
    const options = {
      language: translation || 'en',
      extraPlugins: [this.generateUploadAdapter()]
    }
    const editor = await ClassicEditor.create(selector, options);
    editors[self.key] = editor
    editor.setData(value);
    editor.model.document.on('change:data', () => {
      const value = editor.getData();
      onchange && onchange({value});
    });
  }

  async update({value, self}) {
    const editor = editors[self.key]
    if(editor && editor.getData() !== value) {
      editor.setData(value);
    }
  }

  async terminate({self}) {
    const editor = editors[self.key]
    if(editor) {
      editor.destroy();
      delete editors[self.key];
    }
  }

  render({name, class: klass}) {
    return (
      <div>
        <textarea class={klass} name={name} />
      </div>
    )
  }

}

export default CKEditor;

