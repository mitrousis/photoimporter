PhotoImporter is a personal project to help manage photos on my computer. The goal is to keep my photo collection organized by date in a simple, hopefully future-proofed way.

1) Watches (once or indefinitely) folders for new files. When new files are detected, if they are photos or videos, it will:
    - Move them to a destination folder organized by date (e.g. `/destination/2021-01-01/original_image.jpg`)
    - Rename the file if there is a duplicate file name _and_ they have the same hashes
    - Save any duplicates to a  `_duplicates` folder to ensure nothing is deleted 

2) Watches (once or indefinitely) when removable drives are present, e.g., when an SD is inserted. When specified drive(s) are detected, it will run the copy process, above
    - This functionality is intended to support inserting an SD card, having it automatically copy/organize, then unmount.
    - The files on the SD card are _not_ changed/deleted. Duplicates are ignored.
    - On Mac, the CD card will unmount after copying and play a sound to let you know it's safe to remove. This is really helpful for running a headless photo server.


Caveats:
- It's only been tested, used on MacOS


### Using

Suggested to install globally, `npm install -g` so that it can be run from the command line as `PhotoImporter`.

Command line arguments:


`--directories=path/to/watch,path/to/watch2/` Directories to import/watch

`--drives=SD CARD NAME,UNTITLED` Removable drive labels to import/watch

`--destination=path/to/folder`  Target directory for copying                           

`--watch=true` Continue watching directories/drives for changes