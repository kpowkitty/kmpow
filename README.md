# My Website

Welcome to the source code of my website! This project is a full-stack web application built with modern web technologies.

## Technologies Used

- **Backend:** Django (Python)  
- **Databases:** SQLite, PostgreSQL  
- **Frontend:** React, JavaScript, HTML, CSS  
- **Package Management & Build Tools:** Yarn, Node.js  
- **Data Format:** JSON
- **Hosting / Deployment:** FreeBSD server with Nginx  

## Features

- Full-stack web application with React frontend and Django backend  
- Supports multiple databases (SQLite for development, PostgreSQL for production)  
- RESTful API endpoints for seamless frontend-backend communication  
- Responsive design with modern CSS styling  
- Dynamic forms and interactive components powered by React
- Production-ready deployment on FreeBSD with Nginx  

## Testing

Everything runs in Docker; you only need Docker and Python 3 on the host.

```sh
python3 tests/run.py --list            # available configs (defined in tests/config.py)
python3 tests/run.py ci                # what pull requests run
python3 tests/run.py backend -- -k blog   # extra args go to pytest/jest (single-suite configs)
python3 tests/run.py update-snapshots  # after changing seed data or serializers; commit tests/seed/api/
python3 tests/seed_dev.py [component]  # load seed data into a persistent local dev Postgres
```

- `tests/seed/data/` is the single source of seed data (edge cases included). Backend tests load it
  into Postgres; frontend tests mock `fetch` with `tests/seed/api/`, which are snapshots of the real API
  serving that data.
- Add a test combination by adding an entry to `CONFIGS` in `tests/config.py`.
- Backend results print grouped by file as `name : PASS`; add `-- -v` for pytest's default output.
- Use `yarn add` for frontend dependencies, never `npm install`; the test image installs with
  `--frozen-lockfile` and fails if `yarn.lock` is out of date.
