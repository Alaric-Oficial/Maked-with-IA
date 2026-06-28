from setuptools import setup, find_packages

setup(
    name="auto-ds",
    version="1.0.0",
    description="Auto-DS - Analiza los productos más vendidos de AliExpress por categorías",
    long_description=open("README.md", encoding="utf-8").read(),
    long_description_content_type="text/markdown",
    author="Alaric",
    url="https://github.com/Alaric-Oficial/auto-ds",
    packages=find_packages(),
    install_requires=["requests", "beautifulsoup4", "lxml"],
    entry_points={"console_scripts": ["autods=autods.cli:main"]},
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
)
