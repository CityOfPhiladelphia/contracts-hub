# contracts-hub
This is a vue app for the contracts hub which lives at https://contracts.phila.gov/. To run it locally, you'll need to install node 14. There are a few tricks to doing so. 

## Tricks (probably specific to mac users, sorry Windows users):

You probably have nvm working on your machine. If you try to install node 14 using nvm and it fails, you might have gotten an error about not having the correct version of python running on your machine. If you install the older version of python but still keep getting told you have the modern version, you might need to alias the older version in your zshrc file. 

For me, adding this to the end of my .zshrc file did the trick, but it does feel very hacky. 
````
alias python3=python3.10
````

If you're on a mac and it has an Apple silicon chip, you might need to simulate running arch64 in your terminal (just for the session) to get node 14 installed and running. The hacky solution is this: 
````
arch -x86_64 zsh
````
That'll open a new terminal session under the Rosetta 2 architecture. 

## Migration thoughts
To migrate this into a modern version of node/vue/everything, we'd have to resolve a few issues: 
1. Vue Modal: Can we replace this with PhilaUI?
2. Vue paginate: We could probably roll our own solution pretty simply, but apparently `vuejs-paginate-next`is also a pretty close 1:1 which is Vue 3 compatible.
3. Vue gtag -- possibly just add a script? 
4. Vue fuse - useFuse
5. Moment -- my old enemy. This might be doable in raw JavaScript. Something like this: 
````
  return new Intl.DateTimeFormat("en-US", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',   
    hour: 'numeric',  
    minute: '2-digit', 
    hour12: true, 
    timeZone: "EST",
  }).format(date)
````

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
