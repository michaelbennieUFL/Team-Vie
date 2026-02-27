FROM python:3.14
WORKDIR /usr/local/app

# installs Django and all other dependencies.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY VieBackend /usr/local/app/
EXPOSE 8000

# runs the server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]