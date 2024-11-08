# Intro
B.V.R (beyond visual range) is a simple browser-based 2D game where you play as an air defense officer
onboard a navy ship. The enemy has a vast inventory of anti-ship missiles and will attack you relentlessly.
You must launch and guide your own surface-to-air missiles to stop the onslaught. Be cautious, however, the
airspace is also open to civilian air traffic. Therefore, you must carefully maneuver your missiles to avoid
civilian airliners while keeping your ship safe.
# Install
`npm install`

`npm run dev` to start a development server.
# Controls
You must manually guide your missiles to intercept enemy attacks. Click and hold left mouse button on
the radar screen to draw a path, then release left mouse button to launch the missile. It will then
follow the path on its own.

You can also re-draw the path while the missile is in the air. To do so, simply click and drag the missile
after it has been launched. The missile will then follow the new path.

When the missile gets close enough to an aircraft, it will activate its own guidance systems. When it detects
an aircraft nearby, it will no longer follow your path. Instead it will close in on the target on its own
to ensure a hit. Careful! The missile can't tell apart enemy missiles from civilian airliners, it **will**
kill anything that gets too close.
# Credits
## Libraries and Tools
- Konva.js
- Vite
## Icons, sounds, and sprites
- uxwing.com
- pixabay.com
## Inspired by
- [Attack on Aegis](https://youtu.be/ZcwDfaY4OW4)
- [Command: Modern Operations](https://store.steampowered.com/app/1076160/Command_Modern_Operations/)
