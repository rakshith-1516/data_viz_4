from flask import Flask,render_template, request, jsonify
import pandas as pd
import json

app = Flask(__name__,template_folder="templates")

@app.route("/")
def hello():
    return render_template('index.html')

@app.route('/processData', methods=['POST'])
def processData():
    exoplanetsDf = pd.read_json(json.dumps(request.get_json()['exoplanets']))
    filteredDf = exoplanetsDf.query('detection_method != "Transit Timing Variations"').fillna(0).sample(100)
    filteredDf['stellar_magnitude'] = filteredDf['stellar_magnitude'].replace('', '0')
    filteredDf['stellar_magnitude'] = filteredDf['stellar_magnitude'].astype(float)
    filteredDf['orbital_period'] = filteredDf['orbital_period'].replace('', '0')
    filteredDf['orbital_period'] = filteredDf['orbital_period'].astype(float)
    filteredDf['distance'] = filteredDf['distance'].replace('', '0')
    filteredDf['distance'] = filteredDf['distance'].astype(float)
    filteredDf['orbital_radius'] = filteredDf['orbital_radius'].replace('', '0')
    filteredDf['orbital_radius'] = filteredDf['orbital_radius'].astype(float)
    return filteredDf.to_json(orient="records")

if __name__ == '__main__':
    app.run(debug=True)