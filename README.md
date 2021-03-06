
# Nullstack CKEditor Adapter

Very minimal wrapper component around CKEditor that uploads images to a local folder.

## Install

```bash
npm install --save nullstack-ckeditor-adapter
```

## Usage with one way binding

```jsx
import Nullstack from 'nullstack';
import CKEditor from 'nullstack-ckeditor-adapter';

class Application extends Nullstack {

  content = '<p> Hello </p>';

  updateContent({value}) {
    this.content = value;
  }

  render() {
    return (
      <CKEditor name="content" value={this.content} onchange={this.updateContent} />
    )
  }

}

export default Application;
```

## Usage with two way binding

```jsx
import Nullstack from 'nullstack';
import CKEditor from 'nullstack-ckeditor-adapter';

class Application extends Nullstack {

  content = '<p> Hello </p>';

  render() {
    return (
      <CKEditor bind={this.content} />
    )
  }

}

export default Application;
```

## Options

Files are uploaded to public/uploads by default

You can customize the upload settings by setting a property to the context

```jsx
static async start(context) {
  context.ckeditor = {
    uploadFolder: 'public/uploads/images',
    imagesWidth: 300,
    imagesHeight: 300,
    imagesQuality: 70
  }
}
```

## Language

The default language is english

You can change it per instance by passing a language attribute

```jsx
<CKEditor bind={this.content} language="pt-BR" />
```

You can change the language globally by setting the page.locale in the context

```jsx
prepare({page}) {
  page.locale = "pt-BR";
}
```

## Caveats

You have to manually enable a larger maximum payload size in order to process the uploaded images

```jsx
static async start(context) {
  context.server.maximumPayloadSize = '5mb';
}
```

## License

Nullstack CKEditor Adapter is released under the [MIT License](https://opensource.org/licenses/MIT).
