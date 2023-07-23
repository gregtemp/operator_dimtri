import pandas as pd
from scipy.spatial import Delaunay, ConvexHull, KDTree
from sklearn.decomposition import PCA
# from sklearn.manifold import TSNE
import matplotlib.pyplot as plt
import numpy as np
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.neighbors import NearestNeighbors
import umap.umap_ as umap  # Import UMAP
import json
from collections import Counter
from shapely.geometry import Polygon
from shapely.ops import polygonize, cascaded_union

# Load the data
df = pd.read_csv("operator-presets2-justvals.csv")
df = df.iloc[:, :-1]
#df = df.iloc[:301]
df.fillna(0., inplace=True)
column_names = df.columns.tolist()

scaler = StandardScaler()
df_standardized = scaler.fit_transform(df)

pca = PCA(n_components=None)  # None will keep all principal components
df_pca = pca.fit_transform(df_standardized)

# Perform UMAP on the standardized PCA
reducer = umap.UMAP(n_components=2, n_neighbors = 300, min_dist=0.25, metric="euclidean")  # Initialize UMAP
embedding = reducer.fit_transform(df_pca)

# Normalize the UMAP output
scaler2 = MinMaxScaler()
embedding_normalized = scaler2.fit_transform(embedding)
print(f"embedding list length: {len(embedding_normalized)}")

# Perform Delaunay triangulation on the normalized data
tri = Delaunay(embedding_normalized)
print(f"tri amount: {len(tri.simplices)}")

# Create KD tree from the array of points
kdtree = KDTree(embedding_normalized)

# Declare data and tri as global variables
data = df
global_tri = tri

def interpolate(point):
    # Use the global variables  // chatgpt suggestion, i dont think we need to do this
    global data, global_tri

    # Find the triangle containing the point
    simplex = global_tri.find_simplex(point)
    if simplex == -1:
        # raise ValueError("The point does not lie in any triangle")
        nearest_neighbors = [embedding_normalized[index] for index in kdtree.query(point, k=3)[1]]
        new_point = np.mean(nearest_neighbors, axis=0)
        simplex = global_tri.find_simplex(new_point)
        if simplex == -1:
            print("we have shit the bed, exiting")
            assert False

    vertices = global_tri.simplices[simplex]
    triangle_vertices = embedding_normalized[vertices]

    # Solve for barycentric coordinates
    A = np.vstack([triangle_vertices.T, np.ones(3)])
    B = np.append(point, 1)
    barycentric_coords = np.linalg.lstsq(A, B, rcond=None)[0]

    # Perform the interpolation
    result = np.dot(barycentric_coords, data.iloc[vertices])

    return result

#
#
#       add points to map (extrapolate when outside hull)
#
#

grid_amount = 11
for i in range(grid_amount):
    for j in range(grid_amount):
        point = np.array([i/(grid_amount-1.), j/(grid_amount-1.)])
        #print(point)

        result = interpolate(point)
        series = pd.Series(result, index=data.columns)
        # add result to df as a row
        data = data._append(series, ignore_index=True)
        embedding_normalized = np.append(embedding_normalized,[point], axis=0)
        # Find the two nearest neighbors
        nearest_neighbors = [embedding_normalized[index] for index in kdtree.query(point, k=2)[1]]



# save as a csv if you want to inspect
#data.to_csv("operator.csv", index=False) 

tri = Delaunay(embedding_normalized)
print(f"tri amount: {len(tri.simplices)}")


#Plot the results
plt.triplot(embedding_normalized[:, 0], embedding_normalized[:, 1], tri.simplices, color='lightgray', linewidth=0.8)
plt.plot(embedding_normalized[:, 0], embedding_normalized[:, 1], 'o', markersize=3)
plt.show()



#
#
#       make a grid and populate each cell with all intersecting triangles
#
#

# Grid resolution
resolution = 1/25.

# Create an empty list to store the cell polygons
grid = []

# Generate the polygons
for i in range(25):
    for j in range(25):
        # Compute the boundaries of the cell
        min_x = i * resolution
        max_x = (i+1) * resolution
        min_y = j * resolution
        max_y = (j+1) * resolution
        # Create a polygon representing the cell
        cell = Polygon([(min_x, min_y), (min_x, max_y), (max_x, max_y), (max_x, min_y)])
        # Store the polygon in the list
        grid.append(cell)


def assign_simplices_to_cells(simplices, grid):
    cell_to_simplices = {}
    for idx, simplex in enumerate(simplices):
        # Create a polygon representing the simplex
        simplex_poly = Polygon(tri.points[simplex])
        for cellid, cell in enumerate(grid):
            i = cellid % 25
            j = (cellid // 25)
            # Check for intersection
            if cell.intersects(simplex_poly):
                # Add the simplex to the cell's list in the dictionary
                if cell not in cell_to_simplices:
                    cell_to_simplices[cell] = []
                cell_to_simplices[cell].append(simplex)
                
                # populate the dict the way i want it
                simplex_dict = {f"{idx}": tri.points[simplex]}
                key = f"{j} {i}"  # this is backwards because i cant into science
                if key in cellsimps:
                    cellsimps[key].update(simplex_dict)
                else:
                    cellsimps[key] = simplex_dict
    return cell_to_simplices


cellsimps = {}

# Assign simplices to cells
cell_to_simplices = assign_simplices_to_cells(tri.simplices, grid)


#
#
#       if you want to check some cells visually
#
#

def check_some_cells():
    # Prepare the figure and the axes
    fig, ax = plt.subplots()

    # Set the limits of the plot to the minimum and maximum coordinates
    ax.set_xlim(0., 1.)
    ax.set_ylim(0., 1.)

    # Iterate over the cells
    for i, cell in enumerate(grid):
        if i % 5 == 2 and (i // 25) % 5 == 2:  # Plot every 5th cell
            # Convert the cell's exterior coordinates to a Nx2 array
            cell_coords = np.column_stack(cell.exterior.xy)
            
            # Create and add the cell's patch to the axes
            cell_patch = patches.Polygon(cell_coords, edgecolor='blue', fill=False)
            ax.add_patch(cell_patch)
            
            # Get the simplices contained in this cell
            cell_key = f"{i % 25} {i // 25}"
            contained_simplices = cellsimps.get(cell_key, {}).values()
            
            for simplex in contained_simplices:
                # Convert the simplex's coordinates to a Nx2 array
                simplex_coords = np.array(simplex)
                
                # Create and add the simplex's patch to the axes
                simplex_patch = patches.Polygon(simplex_coords, edgecolor='red', fill=False)
                ax.add_patch(simplex_patch)
                
    # Display the plot
    plt.show()


#
#
#       Most important test, check if a bunch of random points all get assigned to a triangle
#
#

import random
from shapely.geometry import Point

tri_test = Delaunay(embedding_normalized)

def get_test_cell(vertex, step_size):
    #cell_tuple = tuple(int(coord // step_size) for coord in vertex)
    x = int(vertex[0] * 25)
    y = int(vertex[1] * 25)
    return f"{x} {y}"

def point_in_simplex(point, simplex):
    A = np.vstack([simplex.T, np.ones(3)])
    B = np.append(point, 1)
    barycentric_coords = np.linalg.lstsq(A, B, rcond=None)[0]
    epsilon = 1e-9  # Change this to whatever value you consider appropriate
    return np.all((barycentric_coords >= -epsilon) & (barycentric_coords <= 1+epsilon))


# Generate some random points
num_points = 1000  # number of points for testing
random.seed(42)
random_points = [[round(random.random(), 6), round(random.random(), 6)] for _ in range(num_points)]

successful_points = []
unsuccessful_points = []

for point in random_points:
    cell_key = get_test_cell(point, 1/25.)
    simplices = cellsimps.get(cell_key, {})
    found_in_simplex = False
    for simplex in simplices.values():
        if point_in_simplex(point, simplex):
            found_in_simplex = True
            successful_points.append(point)
            break
    if not found_in_simplex:
        unsuccessful_points.append(point)

# Convert to numpy arrays for easier indexing
successful_points = np.array(successful_points)
unsuccessful_points = np.array(unsuccessful_points)
print(len(successful_points)/1000)
print(len(unsuccessful_points)/1000)
# Create the plot
fig, ax = plt.subplots()

# Plot successful points in green
ax.scatter(successful_points[:, 0], successful_points[:, 1], color='green', s=2)
# Plot unsuccessful points in red
if (len(unsuccessful_points) > 0):
    ax.scatter(unsuccessful_points[:, 0], unsuccessful_points[:, 1], color='red', s=2)
else:
    print("success! all points are in triangles!")

plt.show()