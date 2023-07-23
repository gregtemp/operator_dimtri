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
from shapely.geometry import Polygon, Point
import random



use_weights = False
use_pca = True


# Load the data
df = pd.read_csv("../operator-presets2-norm_mod.csv")
df = df.iloc[:, :-1]
#df = df.iloc[:301]
df.fillna(0., inplace=True)
# Strip whitespaces from the column names
df.columns = df.columns.str.replace(' ', '')

column_names = df.columns.tolist()
# scaler = StandardScaler()
# df_standardized = scaler.fit_transform(df)
if (use_weights):
    # Load the JSON file
    with open('coll_weights2.json') as f:
        coll_weights = json.load(f)

    # Make sure the values are interpreted as numbers, not strings
    coll_weights = {k: float(v) for k, v in coll_weights.items()}

    # Multiply each column in the dataframe by its corresponding value in the JSON
    for col in df.columns:
        if col in coll_weights:
            df[col] = df[col].mul(coll_weights[col])

print(df)

if (use_pca):
    pca = PCA(n_components=None)  # None will keep all principal components
    df_pca = pca.fit_transform(df)

# Perform UMAP on the standardized PCA
reducer = umap.UMAP(n_components=2, n_neighbors = 100, min_dist=0.1, metric="euclidean")  # Initialize UMAP
# embedding = reducer.fit_transform(df_pca)
if (use_pca):
    embedding = reducer.fit_transform(df_pca)
else:
    embedding = reducer.fit_transform(df)

# Normalize the UMAP output
scaler2 = MinMaxScaler()
embedding_normalized = scaler2.fit_transform(embedding)
print(f"embedding list length: {len(embedding_normalized)}")

# Perform Delaunay triangulation on the normalized data
tri = Delaunay(embedding_normalized)
print(f"tri amount: {len(tri.simplices)}")

#Plot the results
plt.triplot(embedding_normalized[:, 0], embedding_normalized[:, 1], tri.simplices, color='lightgray', linewidth=0.8)
plt.plot(embedding_normalized[:, 0], embedding_normalized[:, 1], 'o', markersize=3)
plt.show()

# Create KD tree from the array of points
kdtree = KDTree(embedding_normalized)

# Declare data and tri as global variables
data = df
global_tri = tri


def interpolate(point):
    # Use the global variables
    global data, global_tri

    # Find the triangle containing the point
    simplex = global_tri.find_simplex(point)
    if simplex == -1:
        # raise ValueError("The point does not lie in any triangle")
        nearest_neighbors = [embedding_normalized[index] for index in kdtree.query(point, k=3)[1]]
        new_point = np.mean(nearest_neighbors, axis=0)
        simplex = global_tri.find_simplex(new_point)
        #print("point outside, extrapolating...")
        if simplex == -1:
            #print("we have shit the bed, exiting")
            assert False
    # else:
        # Get the vertices of the triangle
        # vertices = global_tri.simplices[simplex]
        # triangle_vertices = embedding_normalized[vertices]

    vertices = global_tri.simplices[simplex]
    triangle_vertices = embedding_normalized[vertices]

    # Solve for barycentric coordinates
    A = np.vstack([triangle_vertices.T, np.ones(3)])
    B = np.append(point, 1)
    barycentric_coords = np.linalg.lstsq(A, B, rcond=None)[0]

    # Perform the interpolation
    result = np.dot(barycentric_coords, data.iloc[vertices])

    return result


# ray casting method to check if point in hull
def point_in_hull(point, hull):
    x = point[0]
    y = point[1]
    n = len(hull.points)
    inside = False
    p1x, p1y = hull.points[0]
    for i in range(n+1):
        p2x, p2y = hull.points[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y-p1y)*(p2x-p1x)/(p2y-p1y)+p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

# first get the convex hull of the points
hull = ConvexHull(embedding_normalized)

grid_amount = 11
for i in range(grid_amount):
    for j in range(grid_amount):
        point = np.array([i/(grid_amount-1.), j/(grid_amount-1.)])
        
        # Check if the point is inside the ConvexHull
        if point_in_hull(point, hull):
            continue # if true, skip to next point
        
        result = interpolate(point)
        series = pd.Series(result, index=data.columns)
        # add result to df as a row
        data = data._append(series, ignore_index=True)
        embedding_normalized = np.append(embedding_normalized,[point], axis=0)
        # Find the two nearest neighbors
        nearest_neighbors = [embedding_normalized[index] for index in kdtree.query(point, k=2)[1]]






tri = Delaunay(embedding_normalized)
print(f"tri amount: {len(tri.simplices)}")


#Plot the results
plt.triplot(embedding_normalized[:, 0], embedding_normalized[:, 1], tri.simplices, color='lightgray', linewidth=0.8)
plt.plot(embedding_normalized[:, 0], embedding_normalized[:, 1], 'o', markersize=3)
plt.show()




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
                key = f"{j} {i}"
                #print(key)
                if key in cellsimps:
                    cellsimps[key].update(simplex_dict)
                else:
                    cellsimps[key] = simplex_dict
    return cell_to_simplices


cellsimps = {}

# Assign simplices to cells
cell_to_simplices = assign_simplices_to_cells(tri.simplices, grid)

## Check if a bunch of random points always land in a triangle
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
num_points = 5000  # number of points for testing
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

plt.show()
# if all points are green you're good to go!


if (use_weights):
    # remember to undo scaling (only do this once)
    # Multiply each column in the dataframe by its corresponding value in the JSON
    for col in data.columns:
        if col in coll_weights:
            data[col] = data[col].mul(1./coll_weights[col])



#
#
#       everything is done, save
#
#

# Create a new dictionary to hold the list-converted data
list_dict = {}

for key, value in cellsimps.items():
    # Convert each numpy array in the value dictionary to a list
    new_value = {k: v.flatten().tolist() for k, v in value.items()}
    # Assign the converted value dictionary to the corresponding key in the new dictionary
    list_dict[key] = new_value

# Now you can save the list_dict as a JSON file
with open("cell_to_simplices.json", "w") as f:
    json.dump(list_dict, f)

points_dict = {str(i): list(row) for i, row in enumerate(tri.points.tolist())}
simplices_dict = {str(i): list(row) for i, row in enumerate(tri.simplices.tolist())}

with open('tri_points.json', 'w') as f:
    json.dump(points_dict, f)

with open('tri_simplices.json', 'w') as f:
    json.dump(simplices_dict, f)

print(data)
data.to_csv("operator.csv", index=False)

data_dict = {idx: row.values.tolist() for idx, row in data.iterrows()}
# Convert the DataFrame to a dictionary
data_dict["cols"] = list(data.columns)

# Convert this dictionary to a JSON string
json_str = json.dumps(data_dict)

# Save this JSON string to a file
with open('operatordf.json', 'w') as f:
    f.write(json_str)