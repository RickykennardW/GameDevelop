// Movement, mortar prediction and Sonar read the same sampled centerline as placement.
const variables = runtimeScene.getVariables();
const points = runtimeScene.__towerShopUI.level.points;
variables.get('MonsterPathPoints').fromJSObject(points);
variables.get('MonsterPathPointCount').setNumber(points.length);
variables.get('MapRouteDirty').setBoolean(false);
