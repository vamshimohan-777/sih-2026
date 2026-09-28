import os
import json
import hashlib

class KeyStorage:
    def __init__(self, storage_dir: str = "./storage/keys"):
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)
        
    def _get_user_dir(self, user_id: str) -> str:
        user_dir = os.path.join(self.storage_dir, user_id)
        os.makedirs(user_dir, exist_ok=True)
        return user_dir

    def save_private_key(self, user_id: str, key_type: str, key_hex: str):
        user_dir = self._get_user_dir(user_id)
        file_path = os.path.join(user_dir, f"{key_type}.key")
        with open(file_path, "w") as f:
            f.write(key_hex)
            
    def load_private_key(self, user_id: str, key_type: str) -> str:
        file_path = os.path.join(self.storage_dir, user_id, f"{key_type}.key")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Key {key_type} for user {user_id} not found.")
        with open(file_path, "r") as f:
            return f.read().strip()

storage_adapter = KeyStorage()
