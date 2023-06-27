import pandas as pd
import json

# Load the dataset
df = pd.read_csv('operator-presets2-norm_mod.csv')
df = df.iloc[:, :-1]
df.fillna(0., inplace=True)

# Get the number of columns
num_cols = len(df.columns)

# Transpose the DataFrame, convert to list and create a dictionary

data_dict = {str(i): values.tolist() for i, values in enumerate(df.values)}

# Construct the final dictionary
json_dict = {"cols": num_cols, "data": data_dict}

name_dict = {str(i): colname.replace(" ", "") for i, colname in enumerate(df.columns)}


# Save to json file
with open('operator-presets.json', 'w') as f:
    json.dump(json_dict, f, indent=4)

with open("operator-paramnames.json", "w") as f:
    json.dump(name_dict, f, indent=4)