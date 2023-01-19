import argparse
from git import Repo
import os
import json

def create_tag(tag_name: str):
    repo = Repo(os.path.dirname(os.path.realpath(__file__)))
    tag = repo.create_tag(tag_name, message=f"chore(bump): v{tag_name}")
    print(f"Tag {tag_name} created")
    # commit
    repo.git.add(update=True)
    repo.index.commit(f"chore(bump): v{tag_name}")
    repo.remotes.origin.push(tag.path)

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
    os.system(f"git-chglog --next-tag v{version} --output CHANGELOG.md")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("version", help="The version to bump to")
    args = parser.parse_args()
    bump_all_files(args.version)
    generate_changelog(args.version)
    create_tag(args.version)
