class RoadmapGenerator:
    @staticmethod
    def adjust_node_states(roadmap, completed_nodes=None):
        """
        Dynamically adjusts node lock states.
        If a node's dependencies (parents) are completed, it becomes 'unlocked'.
        Nodes marked as completed show status 'completed'.
        """
        if not completed_nodes:
            completed_nodes = set()
        else:
            completed_nodes = set(completed_nodes)

        nodes = roadmap.get("nodes", [])
        connections = roadmap.get("connections", [])

        # Build parent-child mapping
        node_parents = {n["id"]: [] for n in nodes}
        for conn in connections:
            parent = conn["from"]
            child = conn["to"]
            if child in node_parents:
                node_parents[child].append(parent)

        # Update node status
        for node in nodes:
            nid = node["id"]
            if nid in completed_nodes:
                node["status"] = "completed"
            else:
                parents = node_parents.get(nid, [])
                if not parents:
                    # Foundational node with no dependencies is always unlocked unless completed
                    node["status"] = "unlocked"
                else:
                    # Check if all parents are completed
                    all_parents_completed = all(p in completed_nodes for p in parents)
                    if all_parents_completed:
                        node["status"] = "unlocked"
                    else:
                        node["status"] = "locked"

        roadmap["nodes"] = nodes
        return roadmap
