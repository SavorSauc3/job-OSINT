from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import math

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def fetch_job_ids(base_url, start, end, step):
    job_ids = []
    for page in range(start, end, step):
        url = base_url.format(page)
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        job_listings = soup.find_all("li")
        for listing in job_listings:
            try:
                job_id = listing.find("div", {"class": "base-card"}).get('data-entity-urn').split(":")[3]
                job_ids.append(job_id)
            except AttributeError:
                continue
    return job_ids

def fetch_job_details(job_ids, base_url, output_file='job_pages.txt'):
    job_details = []
    with open(output_file, 'w') as file:
        for job_id in job_ids:
            url = base_url.format(job_id)
            file.write(url + '\n')  # Write each URL to the file
            
            response = requests.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            job_info = {"id": job_id}  # Include job_id in the job info
            try:
                job_info["company"] = soup.find("div", {"class": "top-card-layout__card"}).find("a").find("img").get('alt')
            except (AttributeError, TypeError):
                job_info["company"] = None
            
            try:
                job_info["job-title"] = soup.find("div", {"class": "top-card-layout__entity-info"}).find("a").text.strip()
            except (AttributeError, TypeError):
                job_info["job-title"] = None
            
            try:
                job_info["level"] = soup.find("ul", {"class": "description__job-criteria-list"}).find("li").text.replace("Seniority level", "").strip()
            except (AttributeError, TypeError):
                job_info["level"] = None
            
            # Extract job description
            try:
                description_div = soup.find("div", {"class": "show-more-less-html__markup show-more-less-html__markup--clamp-after-5 relative overflow-hidden"})
                if description_div:
                    # Replace <br> tags with newline characters
                    for br in description_div.find_all("br"):
                        br.replace_with("\n")
                    job_info["description"] = description_div.get_text(separator="\n").strip()
                else:
                    job_info["description"] = None
            except (AttributeError, TypeError):
                job_info["description"] = None
            
            # Filter out jobs where all fields are None
            if job_info["company"] or job_info["job-title"] or job_info["level"] or job_info["description"]:
                job_details.append(job_info)
    
    return job_details

@app.route('/jobs', methods=['GET'])
def get_jobs():
    keyword = request.args.get('keyword')
    location = request.args.get('location')
    
    if not keyword:
        return jsonify({"error": "Keyword parameter is required"}), 400
    
    if not location:
        location = "Las Vegas, Nevada, United States"  # Default location if not provided

    geo_id = "100293800"
    start_job_id = 0
    job_count = 117
    jobs_per_page = 25
    
    search_url = f'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={requests.utils.quote(keyword)}&location={requests.utils.quote(location)}&geoId={geo_id}&start={{}}'
    job_details_url = 'https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{}'
    
    job_ids = fetch_job_ids(search_url, start_job_id, math.ceil(job_count / jobs_per_page) * jobs_per_page, jobs_per_page)
    
    job_details = fetch_job_details(job_ids, job_details_url)
    
    return jsonify(job_details)

@app.route('/save-job', methods=['POST'])
def save_job():
    job_info = request.json
    
    # Create the text content
    text_content = f"Company: {job_info.get('company', 'N/A')}\n"
    text_content += f"Job Title: {job_info.get('job-title', 'N/A')}\n"
    text_content += f"Level: {job_info.get('level', 'N/A')}\n\n"
    text_content += f"Description:\n{job_info.get('description', 'N/A')}"

    return Response(
        text_content,
        mimetype='text/plain',
        headers={"Content-Disposition": "attachment;filename=job-details.txt"}
    )

if __name__ == "__main__":
    app.run(debug=True)

if __name__ == "__main__":
    app.run(debug=True)
