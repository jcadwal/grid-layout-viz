# grid-layout-viz

Arranges images on two or three dimensional grid by calculating an arbitrary pairwise cost function between all image pairs, maintaining a "border" set of unoccupied grid locations, and then assigning the lowest cost image to a grid location based total cost with the location's preexisting assignments.

In this demo the pairwise cost is simple euclidean distance and the images are MNIST digits.