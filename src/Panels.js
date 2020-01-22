import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import ReactJson from 'react-json-view'
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    height: "100vh",
    padding: theme.spacing(2),
    color: theme.palette.text.secondary,
  },
}));

const schemaA = {
    "$id": "https://example.com/person.schema.json",
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Person",
    "type": "object",
    "properties": {
        "firstName": {
            "type": "string",
            "description": "The person's first name."
        },
        "lastName": {
            "type": "string",
            "description": "The person's last name."
        },
        "age": {
            "description": "Age in years which must be equal to or greater than zero.",
            "type": "integer",
            "minimum": 0
        }
    }
}

const exampleA = {
    firstName: "John",
    lastName: "Doe",
    age: 12
}

const schemaB = {
    "$id": "https://example.com/person.schema.json",
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Person",
    "type": "object",
    "properties": {
            "Name": {
            "type": "string",
            "description": "The person's first and last name."
        },
            "AgeInMonths": {
            "description": "Age in Months which must be equal to or greater than zero.",
            "type": "integer",
            "minimum": 0
        }
    }
}

const pathToHash = (path) => (path.join('_'))
const transform = (transformation, input) => {
    let output = {}

    transformation.forEach( (connection) => {
        let pathTo = connection.pathTo[1];
        let func = () => (input[connection.pathFrom[0][1]])
        if(connection.transform) {
            let funcArguments = connection.pathFrom.map( (path) => (pathToHash(path))).join(',')
            let completeFunction = 'func = function(' + funcArguments + ') {' + connection.transform + '}';
            console.log("completeFunction", completeFunction)
            eval (completeFunction)

        }

        output[pathTo] = func.apply(null, connection.pathFrom.map( (path) => (input[path[1]]) ) )

    } )

    return output
}

const removeKey = (obj, propToDelete) => {
    const { [propToDelete]: deleted, ...objectWithoutDeletedProp } = obj;
    return objectWithoutDeletedProp;
};

export default function AutoGrid() {
    const classes = useStyles();
    const [leftSelectedElements, selectElementLeft] = useState([]);
    const [rightSelectedElement, selectElementRight] = useState(null);
    const [transformation, updateTransformation] = useState({})
    const [currentTransfom, updateTransform] = useState('')

    const onSave = () => {
        updateTransformation( {
            ...transformation,
            [pathToHash(rightSelectedElement)]: {
                pathFrom: Object.values(leftSelectedElements),
                pathTo: rightSelectedElement,
                transform: currentTransfom,
            }
        })
    }

    const onSelectLeft = (newSelection) => {
        let hash = pathToHash(newSelection.namespace)
        if (leftSelectedElements[hash])
            selectElementLeft(removeKey(leftSelectedElements, hash))
        else
            selectElementLeft({...leftSelectedElements, [hash]: newSelection.namespace})
    }

    let result = transform(Object.values(transformation), exampleA)
    return (
        <div className={classes.root}>
            {Object.keys(leftSelectedElements)}
            <Grid container spacing={3}>
            <Grid item xs>
                <Paper className={classes.paper}>
                    <ReactJson onSelect={onSelectLeft} displayDataTypes={false} src={schemaA} />
                    <Divider />
                    <ReactJson displayDataTypes={false} src={exampleA} />

                </Paper>
            </Grid>
            <Grid item xs>
                <Paper className={classes.paper}>
                <Grid
                    container
                    direction="column"
                    justify="flex-end"
                    alignItems="stretch"
                    spacing={3}
                    >
                        <Grid item xs={12}>
                            <TextField
                                id="filled-multiline-static"
                                fullWidth={true}
                                label="Transformation"
                                multiline
                                rows="8"
                                variant="filled"
                                value={currentTransfom}
                                onChange={(e) => { updateTransform(e.target.value) }}
                                />
                        </Grid>
                        <Grid item xs >
                                <Button onClick={onSave} disabled={!rightSelectedElement || !leftSelectedElements} variant="contained" color="primary"> Save </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
            <Grid item xs>
                <Paper className={classes.paper}>
                {rightSelectedElement}
                <ReactJson
                    onSelect={ (select) => {
                        let existingConnection = transformation[pathToHash(select.namespace)]
                        updateTransform(existingConnection ? existingConnection.transform : '')
                        selectElementRight(select.namespace)}
                    }
                    displayDataTypes={false} src={schemaB} />
                <Divider />
                    <ReactJson displayDataTypes={false} src={result} />

                </Paper>
            </Grid>
            </Grid>

        </div>
    );
}
