# Laudanum

Pre-built injectable web shell files for multiple server-side languages. Gives command execution or a reverse shell via the browser after upload to a vulnerable web app.

Built into Parrot OS and Kali at `/usr/share/laudanum`. Otherwise: https://github.com/jbarcia/Web-Shells/tree/master/laudanum

Languages: `asp` `aspx` `jsp` `php` and more.

---

## Workflow

```bash
# 1. Copy the file you want to use
cp /usr/share/laudanum/aspx/shell.aspx /home/tester/demo.aspx
```

```bash
# 2. Edit the file — set your IP in the allowedIps variable (line ~59 for .aspx)
#    Also strip out the ASCII art and comments before uploading
nano demo.aspx
```

```bash
# 3. Upload via the target web app's file upload function
#    Note where the server saves it — the app may print the path on success
```

```bash
# 4. Browse to the uploaded shell and issue commands
http://<target>/files/demo.aspx
```

---

## Notes

> Strip the ASCII art and comments before uploading — defenders and AV commonly signature on them.

> Upload paths aren't always predictable. Some apps randomise filenames or restrict directory listing. Check the response after upload for the save path.

> For reverse shells within Laudanum, set your attack host IP in the file before upload so the callback reaches you.
