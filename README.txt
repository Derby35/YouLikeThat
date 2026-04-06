You Like That - CIS 4004 Term Project, Spring 2026
===================================================

You Like That is a MERN stack app for browsing NFL player stats, building
watchlists, and tracking your favorite players. Admins can manage all
player and stat data from a built-in panel.


WHAT YOU NEED INSTALLED
-----------------------
1. Node.js v18 or higher
   Download: https://nodejs.org

2. MongoDB 8.x Community Edition
   Download: https://www.mongodb.com/try/download/community
   During install, check "Install MongoDB as a Service" — this makes it
   start automatically with Windows so you never have to deal with it.


FIRST TIME SETUP
----------------
Open a terminal in the YouLikeThat folder and run these three commands:

  npm install
  npm run setup
  npm run seed

npm run seed loads sample NFL players and stats into your local database
so the app works immediately without needing internet access.

Want real ESPN data (top 120 players from the 2024 season)? Run this
after the seed — it takes about 2 minutes:

  npm run fetch

The app never calls ESPN while running. It only reads from MongoDB,
so fetch is just a one-time import.


STARTING THE APP
----------------
Option A — Double-click start.bat in the YouLikeThat folder.

Option B — Run this from the YouLikeThat folder:
  npm run dev

Once both servers are up, open http://localhost:5173 in your browser.


LOGIN CREDENTIALS
-----------------
  admin       Admin123!    (add/edit/delete players and stats)
  john_doe    Password1!   (browse players, manage watchlists)
  jane_smith  Password1!   (same as john_doe)

You can also register a new account from the login page.


REFRESHING PLAYER DATA
----------------------
Re-import from ESPN anytime:
  cd server
  npm run fetch

Reset back to sample data if ESPN is down:
  cd server
  npm run seed


TROUBLESHOOTING
---------------
"ECONNREFUSED 27017" — MongoDB isn't running.
  Open PowerShell as Administrator and run: net start MongoDB

"Login failed" after re-seeding — your old token is stale.
  Just log out and log back in.

"Cannot find module" errors — you probably skipped npm run setup.
  Run it again from the YouLikeThat folder: npm run setup

"MongoDB seg fault" errors on Linux - utilize Docker and
MongoDB Versions 4.4
