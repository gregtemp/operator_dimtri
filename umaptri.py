import pandas as pd
from scipy.spatial import Delaunay
from sklearn.manifold import TSNE
import matplotlib.pyplot as plt
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import itertools

from pythonosc import udp_client, dispatcher, osc_server
import threading

# Server setup
dispatcher = dispatcher.Dispatcher()

client = udp_client.SimpleUDPClient("127.0.0.1", 9001)
client.send_message("/status", 1)

# Load the data
df = pd.read_csv("operator-presets2-norm_mod.csv")
df = df.iloc[:, :-1]
df.fillna(0., inplace=True)
column_names = df.columns.tolist()

# Perform t-SNE dimensionality reduction
reducer = TSNE(n_components=2, random_state=192, perplexity=200.0)
embedding = reducer.fit_transform(df)

# Normalize the t-SNE output
scaler = MinMaxScaler()
embedding_normalized = scaler.fit_transform(embedding)

# Perform Delaunay triangulation on the normalized data
tri = Delaunay(embedding_normalized)

# Plot the results
plt.triplot(embedding_normalized[:, 0], embedding_normalized[:, 1], tri.simplices)
plt.plot(embedding_normalized[:, 0], embedding_normalized[:, 1], 'o')
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



# # Generate a random 2D point
# point = np.array([0.5, 0.5])

# # Interpolate the data at this point
# try:
#     result = interpolate(point)
#     print("Interpolated data:", result)
# except ValueError:
#     print("The point is not in any triangle")


import json

# Save the t-SNE embedding
# Convert embedding to list of lists and create a dict with indices as keys
embedding_dict = {str(i): list(row) for i, row in enumerate(embedding_normalized.tolist())}

# Save to JSON
with open('tsne_embedding.json', 'w') as f:
    json.dump({"cols": embedding_normalized.shape[1], "data": embedding_dict}, f)

# Convert points and simplices to list of lists and create a dict with indices as keys
points_dict = {str(i): list(row) for i, row in enumerate(tri.points.tolist())}
simplices_dict = {str(i): list(row) for i, row in enumerate(tri.simplices.tolist())}

# Save to JSON
with open('tri_points.json', 'w') as f:
    json.dump({"cols": tri.points.shape[1], "data": points_dict}, f)

with open('tri_simplices.json', 'w') as f:
    json.dump({"cols": tri.simplices.shape[1], "data": simplices_dict}, f)


from collections import defaultdict

# Initialize a defaultdict with list as default factory
point_to_simplices = {str(i): [] for i in range(len(embedding))}
#point_to_simplices = defaultdict(list)

# Iterate over each triangle and add the triangle index to each point's list
for i, triangle in enumerate(tri.simplices):
    for point in triangle:
        point_to_simplices[str(point)].append(i)

# Now point_to_simplices is a dict where the keys are point indices, and the values are lists of triangle indices
# Convert integer keys to strings
point_to_simplices_str_keys = {k: v for k, v in point_to_simplices.items()}

# Save this dictionary to a JSON file
with open('point_to_simplices.json', 'w') as f:
    json.dump(point_to_simplices_str_keys, f)







# def handle_message(unused_addr, *values):
#     # Convert the received values to a PyTorch tensor
#     input_data = np.array(values, dtype=np.float32)  # unsqueeze(0) to add batch dimension
#     print(f"/input - {values}")
#     # Send the input data to the model and get the output
   
#     # Convert the output to a list and send it back over OSC
#     output_list = interpolate(input_data).tolist()  # squeeze(0) to remove batch dimension
#     interlaced = [[name, value] for name, value in zip(column_names, output_list)]
#     flattened = list(itertools.chain(*interlaced))
#     client.send_message("/prediction", flattened)

# dispatcher.map("/input", handle_message)

# def osc_serve():
#     try:
#         server = osc_server.ThreadingOSCUDPServer(('localhost', 9000), dispatcher)
#         print("Serving on {}".format(server.server_address))
#         client.send_message("/status", 2)
#         server.serve_forever()
#     except KeyboardInterrupt:
#         print("\nShutting down OSC Server...")
#         server.shutdown()
#         server.server_close()
#         client.send_message("/status", 0)
#         print("OSC Server shut down successfully.")

# # osc_serve()

