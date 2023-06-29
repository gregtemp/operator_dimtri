import pandas as pd
from scipy.spatial import Delaunay
from sklearn.manifold import TSNE
import matplotlib.pyplot as plt
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import umap  # Import UMAP
import json

# Load the data
df = pd.read_csv("../operator-presets2-norm_mod.csv")
df = df.iloc[:, :-1]
#df = df.iloc[:301]
df.fillna(0., inplace=True)
column_names = df.columns.tolist()

# Perform t-SNE dimensionality reduction
reducer = umap.UMAP(n_components=2, random_state=42, n_neighbors = 300, min_dist=0.25, metric="cosine")  # Initialize UMAP
embedding = reducer.fit_transform(df)

# Normalize the t-SNE output
scaler = MinMaxScaler()
embedding_normalized = scaler.fit_transform(embedding)
print(f"embedding list length: {len(embedding_normalized)}")
# Perform Delaunay triangulation on the normalized data
tri = Delaunay(embedding_normalized)
print(f"tri amount: {len(tri.simplices)}")
# Plot the results
plt.triplot(embedding_normalized[:, 0], embedding_normalized[:, 1], tri.simplices, color='lightgray', linewidth=0.8)
plt.plot(embedding_normalized[:, 0], embedding_normalized[:, 1], 'o', markersize=3)
plt.show()

# Declare data and tri as global variables
data = df
global_tri = tri

def interpolate(point):
    # Use the global variables
    global data, global_tri
    
    # Find the triangle containing the point
    simplex = global_tri.find_simplex(point)
    if simplex == -1:
        raise ValueError("The point does not lie in any triangle")
    
    # Get the vertices of the triangle
    vertices = global_tri.simplices[simplex]
    triangle_vertices = embedding_normalized[vertices]
    
    # Solve for barycentric coordinates
    A = np.vstack([triangle_vertices.T, np.ones(3)])
    B = np.append(point, 1)
    barycentric_coords = np.linalg.lstsq(A, B, rcond=None)[0]

    # Perform the interpolation
    result = np.dot(barycentric_coords, data.iloc[vertices])

    return result

def get_current_tri(point):
    global data, global_tri
    
    # Find the triangle containing the point
    simplex = global_tri.find_simplex(point)
    if simplex == -1:
        raise ValueError("The point does not lie in any triangle")
    
    # Get the vertices of the triangle
    vertices = global_tri.simplices[simplex]
    triangle_vertices = embedding_normalized[vertices]
    return triangle_vertices

# # Generate a random 2D point
# point = np.array([0.5, 0.5])

# # Interpolate the data at this point
# try:
#     result = interpolate(point)
#     print("Interpolated data:", result)
# except ValueError:
#     print("The point is not in any triangle")




# Save the t-SNE embedding
# Convert embedding to list of lists and create a dict with indices as keys
# embedding_dict = {str(i): list(row) for i, row in enumerate(embedding_normalized.tolist())}

# Convert points and simplices to list of lists and create a dict with indices as keys
points_dict = {str(i): list(row) for i, row in enumerate(tri.points.tolist())}
simplices_dict = {str(i): list(row) for i, row in enumerate(tri.simplices.tolist())}

# Initialize a defaultdict with list as default factory
point_to_simplices = {str(i): [] for i in range(len(embedding))}
# Iterate over each triangle and add the triangle index to each point's list
for i, triangle in enumerate(tri.simplices):
    for point in triangle:
        point_to_simplices[str(point)].append(i)

# Now point_to_simplices is a dict where the keys are point indices, and the values are lists of triangle indices
# Convert integer keys to strings
point_to_simplices_str_keys = {k: v for k, v in point_to_simplices.items()}

# Save to JSON
# with open('tsne_embedding.json', 'w') as f:
#     json.dump({"cols": embedding_normalized.shape[1], "data": embedding_dict}, f)



# Save to JSON
with open('tri_points.json', 'w') as f:
    json.dump({"cols": tri.points.shape[1], "data": points_dict}, f)

with open('tri_simplices.json', 'w') as f:
    json.dump({"cols": tri.simplices.shape[1], "data": simplices_dict}, f)

# Save this dictionary to a JSON file
with open('point_to_simplices.json', 'w') as f:
    json.dump(point_to_simplices_str_keys, f)







