import pandas as pd
import os

df = pd.DataFrame({'hello': [1, 2, 3]})
os.makedirs('data', exist_ok=True)
df.to_excel("data/test_dummy.xlsx", index=False)

print("Dummy saved to:", os.path.abspath("data/test_dummy.xlsx"))