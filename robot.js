var roads = [
    "Alice's House-Bob's House",   "Alice's House-Cabin",
    "Alice's House-Post Office",   "Bob's House-Town Hall",
    "Daria's House-Ernie's House", "Daria's House-Town Hall",
    "Ernie's House-Grete's House", "Grete's House-Farm",
    "Grete's House-Shop",          "Marketplace-Farm",
    "Marketplace-Post Office",     "Marketplace-Shop",
    "Marketplace-Town Hall",       "Shop-Town Hall"
];

function buildGraph(edges) {
    let graph = Object.create(null);
    function addEdge(from, to) {
        if (graph[from] == null) {
            graph[from] = [to];
        } else {
            graph[from].push(to);
        }
    }
    for (let [from, to] of edges.map(r => r.split("-"))) {
        addEdge(from, to);
        addEdge(to, from);
    }
    return graph;
}

var roadGraph = buildGraph(roads);

var VillageState = class VillageState {
    constructor(place, parcels) {
        this.place = place;
        this.parcels = parcels;
    }

    move(destination) {
        if (!roadGraph[this.place].includes(destination)) {
            return this;
        } else {
            let parcels = this.parcels.map(p => {
                if (p.place != this.place) return p;
                return {place: destination, address: p.address};
            }).filter(p => p.place != p.address);
            return new VillageState(destination, parcels);
        }
    }
}

function runRobot(state, robot, memory) {
    for (let turn = 0;; turn++) {
        if (state.parcels.length == 0) {
            return turn;
        }
        let action = robot(state, memory);
        state = state.move(action.direction);
        memory = action.memory;
    }
}


function randomPick(array) {
    let choice = Math.floor(Math.random() * array.length);
    return array[choice];
}

function randomRobot(state) {
    return {direction: randomPick(roadGraph[state.place])};
}

VillageState.random = function(parcelCount = 5) {
    let parcels = [];
    for (let i = 0; i < parcelCount; i++) {
        let address = randomPick(Object.keys(roadGraph));
        let place;
        do {
            place = randomPick(Object.keys(roadGraph));
        } while (place == address);
        parcels.push({place, address});
    }
    return new VillageState("Post Office", parcels);
};

var mailRoute = [
    "Alice's House", "Cabin", "Alice's House", "Bob's House",
    "Town Hall", "Daria's House", "Ernie's House",
    "Grete's House", "Shop", "Grete's House", "Farm",
    "Marketplace", "Post Office"
];

function routeRobot(state, memory) {
    if (memory.length == 0) {
        memory = mailRoute;
    }
    return {direction: memory[0], memory: memory.slice(1)};
}

function findRoute(graph, from, to) {
    let work = [{at: from, route: []}];
    for (let i = 0; i < work.length; i++) {
        let {at, route} = work[i];
        for (let place of graph[at]) {
            if (place == to) return route.concat(place);
            if (!work.some(w => w.at == place)) {
                work.push({at: place, route: route.concat(place)});
            }
        }
    }
}

function goalOrientedRobot({place, parcels}, route) {
    if (route.length == 0) {
        let parcel = parcels[0];
        if (parcel.place != place) {
            route = findRoute(roadGraph, place, parcel.place);
        } else {
            route = findRoute(roadGraph, place, parcel.address);
        }
    }
    return {direction: route[0], memory: route.slice(1)};
}
function compareRobots(robot1, memory1, robot2, memory2) {
    const TASK_NUMBER = 100;
    const TASK_LIST = Array.from({length: TASK_NUMBER}, () => VillageState.random());
    let totalTurnsRobot1 = 0;
    let totalTurnsRobot2 = 0;

    for (let taskState of TASK_LIST) {
        totalTurnsRobot1 += runRobot(taskState, robot1, memory1);
        totalTurnsRobot2 += runRobot(taskState, robot2, memory2);
    }

    const avgTurnsRobot1 = totalTurnsRobot1 / TASK_NUMBER;
    const avgTurnsRobot2 = totalTurnsRobot2 / TASK_NUMBER;

    return { robot1: avgTurnsRobot1, robot2: avgTurnsRobot2 };
}

function smartRobot({place, parcels}, route) {
    let shortest_route = route;

    if (route.length == 0) {
        let routes = [];
        const PICK_UP = "Pick Up";
        const DELIVER = "Delivery";
        for (let parcel of parcels) {
            if (parcel.place != place) {
                route = findRoute(roadGraph, place, parcel.place);
                routes.push({
                    path: route,
                    steps: route.length,
                    action_type: PICK_UP
                });
            }
            else {
                route = findRoute(roadGraph, place, parcel.address);
                routes.push({
                    path: route,
                    steps: route.length,
                    action_type: DELIVER
                });
            }
        }
        if (routes.some(route => route.action_type == PICK_UP)) {
            shortest_route = routes.filter(route => {
                return route.action_type == PICK_UP;
            }).reduce((minimum_route, route) => {
                return route.steps < minimum_route.steps ? route : minimum_route;
            }).path;
        }
        else {
            shortest_route = routes.reduce((minimum_route, route) => {
                return route.steps < minimum_route.steps ? route : minimum_route;
            }).path;
        }
    }
    return {
        direction: shortest_route[0],
        memory: shortest_route.slice(1)
    };
}


let results = compareRobots(smartRobot, [], goalOrientedRobot, []);
console.log(results)


class PGroup {
    constructor(items) {
        this.items = items || [];
    }

    add(item) {
        if (this.items.includes(item)) {
            return this;
        } else {
            return new PGroup(this.items.concat([item]));
        }
    }

    delete(item) {
        if (this.items.includes(item)) {
            return new PGroup(this.items.filter(x => x !== item));
        } else {
            return this;
        }
    }

    has(item) {
        return this.items.includes(item);
    }

    static get empty() {
        return new PGroup();
    }
}

let a = PGroup.empty.add("a");
let ab = a.add("b");
let b = ab.delete("a");

console.log(b.has("b"));
// → true
console.log(a.has("b"));
// → false
console.log(b.has("a"));
// → false
