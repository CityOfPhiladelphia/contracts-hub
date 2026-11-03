# contracts-hub

## About
Contracts Hub lets businesses search City of Philadelphia contract opportunities from PHLContracts and eContract Philly in one place. It's a Vue 2 single-page app that reads the `contract_opportunities` table from [Carto](https://phl.carto.com/) and filters it in the browser.

**Used by:** [contracts.phila.gov](https://contracts.phila.gov/)

## Ownership
- **Team:** see [CODEOWNERS](.github/CODEOWNERS).
- **Contact:** TODO: team channel or email list

## Standards
This repository follows the [City of Philadelphia OIT Engineering Guides](https://github.com/CityOfPhiladelphia/guides).

**Exceptions** (legacy decisions):
- There's no `dev` branch. Work branches open pull requests straight into `staging`.
- Deploys run on every push to `staging` and `main`, not from release tags.

## Getting started
You need Node.js 24 (the version is pinned in [`.nvmrc`](.nvmrc)) and npm.

```
npm ci
npm run serve
```

The app runs at http://localhost:8080.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Builds the production site into `dist/` |
| `npm run lint` | Checks code style |
| `npm run test:unit` | Runs the unit tests |

## Deployment
Both environments deploy automatically through GitHub Actions:

| Branch | Workflow | Deploys to |
| --- | --- | --- |
| `staging` | [`staging.yml`](.github/workflows/staging.yml) | S3 bucket `contracts-hub-staging` |
| `main` | [`main.yml`](.github/workflows/main.yml) | S3 bucket `contracts-hub`, served at contracts.phila.gov through CloudFront |

Each workflow installs dependencies, runs the unit tests, builds the site, and copies `dist/` to the bucket. A failing test stops the deploy.

To release:
1. Merge your pull request into `staging` and check the staging site.
2. Open a pull request from `staging` into `main`. Merging it deploys to production.

There are no manual steps. Changes show up on the site shortly after the workflow finishes.

## Testing
Unit tests use [Jest](https://jestjs.io/) and [Vue Test Utils](https://v1.test-utils.vuejs.org/). They live in [`tests/unit/`](tests/unit/) and run in CI before every deploy.

```
npm run test:unit
```

Tests for known bugs are marked `it.skip` with a comment explaining the bug. Unskip them when the bug is fixed.

## Configuration
There are no environment variables. These values are set in the code:
- **Carto endpoint:** in [`ContractsHub.vue`](src/components/ContractsHub.vue).
- **Google Analytics ID:** in [`main.js`](src/main.js). It's a Universal Analytics ID, and Google shut down Universal Analytics in 2023, so it probably isn't recording anything.

The AWS credentials for deploys are stored as GitHub Actions secrets (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`) on this repository.

## Future State
Consider how the contracts hub should exist after migration away from WordPress.
We can avoid the hastle of upgrading to Vue 3 because of this uncertainty. 
### Migration thoughts (by Mill Mason)
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
