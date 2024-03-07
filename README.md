# treesum

Adds a panel in the file explorer which summarizes the files and folders in the
current VSCode workspace.

If you need help, have questions, or have any feature requests, please file a
[Github issue](https://github.com/hardik-vala/TreeSum/issues).

## Features

Expand the 'File and Folder Summaries' panel in the file explorer to generate 
summaries using OpenAI API's.

![demo](https://i.postimg.cc/Prfqkd6Y/demo.gif)

The summaries are not refreshed when the underlying file and directories change.
You can manually trigger a refresh with the command, `treesum.refresh`.

## Extension Settings

This extension contributes the following settings:

* `treesum.apiKey`: OpenAI API key.
* (Optional) `treesum.model`: Set the OpenAI model, as defined on this
[page](https://platform.openai.com/docs/models/continuous-model-upgrades).

## Known Issues

* The generated descriptions are not always accurate or informative. I'm working
on improving quality and minimizing hallucination.
* The extension can malfunction with really big repositories because of rate
limitations imposed by the OpenAI API's.
