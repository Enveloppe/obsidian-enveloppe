import argparse
from git import Repo
import os
import json

def create_tag(tag_name: str):
    repo = Repo(os.getcwd())
    # commit all changes
    repo.git.add(update=True)
    repo.git.commit('-am', f"chore(bump): v{tag_name}")
    # create tag
    repo.git.create_tag(f"v{tag_name}", message=f"chore(bump): v{tag_name}")
    # push to remote
    repo.git.push('--atomic', 'origin', 'master', f"{tag_name}")

def bump_file_version(version: str, file: str):
    with open(file, "r+") as f:
        package = json.load(f)
        package["version"] = version
        print(f"Bumping {file} to version {version}")
        f.seek(0)
        json.dump(package, f, indent=4)
        f.truncate()

def bump_all_files(version: str):
    file_to_bump = ["package.json", "package-lock.json", "manifest.json", "manifest-beta.json"]
    if "b" in version:
        file_to_bump.remove("manifest.json")
    for file in file_to_bump:
        bump_file_version(version, file)

def generate_changelog(version: str):
    if "b" in version:
        os.system(f"git-chglog --next-tag v{version} --output CHANGELOG-beta.md")
    else:
        os.system(f"git-chglog --next-tag v{version} --output CHANGELOG.md")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("version", help="The version to bump to")
    args = parser.parse_args()
    bump_all_files(args.version)
    #generate_changelog(args.version)
    create_tag(args.version)
