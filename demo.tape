# VHS tape file for CuraK demo
# Run with: vhs demo.tape

Output assets/curak-demo.gif

Set Shell "bash"
Set FontSize 14
Set Width 1200
Set Height 700
Set Theme "Dracula"
Set Padding 20

# Start the application
Type "NODE_ENV=production node dist/index.js"
Enter
Sleep 2s

# Navigate through articles
Sleep 500ms
Type "j"
Sleep 300ms
Type "j"
Sleep 300ms
Type "j"
Sleep 300ms
Type "k"
Sleep 300ms
Type "k"
Sleep 500ms

# Open theme selector
Type "T"
Sleep 1s

# Navigate themes
Type "j"
Sleep 300ms
Type "j"
Sleep 300ms
Type "j"
Sleep 300ms

# Select theme
Enter
Sleep 1s

# Navigate more
Type "j"
Sleep 300ms
Type "j"
Sleep 500ms

# Quit
Type "q"
Sleep 500ms
