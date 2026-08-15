import streamlit as st
import pandas as pd
from itertools import combinations
from collections import Counter

st.set_page_config(
    page_title="Fantasy Soccer Draft Analyzer",
    page_icon="⚽",
    layout="wide"
)

st.title("⚽ Fantasy Soccer Draft Analyzer")
st.caption("Phase 1 — Excel remains the master historical database.")


# ---------------------------------------------------------
# DATA PARSING
# ---------------------------------------------------------

def parse_legacy_sheet(raw):
    """Parse the original position-row format used in Sheet1."""
    teams = []
    current_team = None
    current_position = None

    for _, row in raw.iterrows():
        values = [
            str(x).strip()
            for x in row.tolist()
            if pd.notna(x) and str(x).strip()
        ]

        if not values:
            continue

        first = values[0]

        if first.upper() in ["F", "M", "D", "G"]:
            current_position = first.upper()

            if current_team is None:
                continue

            for player in values[1:]:
                teams[-1]["players"].append({
                    "player": player,
                    "position": current_position
                })
        else:
            current_team = first
            teams.append({
                "team": current_team,
                "players": []
            })

    return teams


def parse_normalized_sheet(raw):
    """
    Parse the Phase 1 normalized database format:
    Draft / Competition | Position | Player
    """
    raw = raw.copy()
    raw.columns = [str(c).strip() for c in raw.iloc[0]]
    raw = raw.iloc[1:].copy()

    required = {"Draft / Competition", "Position", "Player"}

    if not required.issubset(set(raw.columns)):
        return []

    raw = raw.dropna(subset=["Draft / Competition", "Player"])

    teams = []

    for team_name, group in raw.groupby("Draft / Competition"):
        players = []

        for _, row in group.iterrows():
            position = str(row["Position"]).strip().upper()
            player = str(row["Player"]).strip()

            if player and position in ["F", "M", "D", "G"]:
                players.append({
                    "player": player,
                    "position": position
                })

        if players:
            teams.append({
                "team": str(team_name).strip(),
                "players": players
            })

    return teams


def parse_sheet(uploaded_file, sheet_name):
    raw = pd.read_excel(
        uploaded_file,
        sheet_name=sheet_name,
        header=None
    )

    if sheet_name == "Football Fantasy Drafts":
        return parse_normalized_sheet(raw)

    return parse_legacy_sheet(raw)


def flatten_teams(teams):
    rows = []

    for team in teams:
        for p in team["players"]:
            rows.append({
                "team": team["team"],
                "player": p["player"],
                "position": p["position"]
            })

    return pd.DataFrame(rows)


def display_name(player, position):
    return f"{player} ({position})"


# ---------------------------------------------------------
# SIDEBAR
# ---------------------------------------------------------

st.sidebar.header("Historical Database")

uploaded_file = st.sidebar.file_uploader(
    "Upload your Excel database",
    type=["xlsx", "xls"]
)

if uploaded_file is None:
    st.info("Upload your Excel database in the sidebar to begin.")
    st.stop()

try:
    workbook = pd.ExcelFile(uploaded_file)
    sheet_names = workbook.sheet_names
except Exception as e:
    st.error(f"Could not read the Excel workbook: {e}")
    st.stop()

# Select which database tab to analyze.
default_sheet = (
    "Football Fantasy Drafts"
    if "Football Fantasy Drafts" in sheet_names
    else sheet_names[0]
)

selected_sheet = st.sidebar.selectbox(
    "Database",
    sheet_names,
    index=sheet_names.index(default_sheet)
)

teams = parse_sheet(uploaded_file, selected_sheet)
df = flatten_teams(teams)

if df.empty:
    st.warning(
        f"No draft data was found in the '{selected_sheet}' tab. "
        "Add historical drafts to that tab and upload the updated workbook."
    )
    st.stop()

df["player"] = df["player"].astype(str).str.strip()
df["team"] = df["team"].astype(str).str.strip()
df["position"] = df["position"].astype(str).str.upper().str.strip()

unique_players = sorted(df["player"].unique())
team_names = sorted(df["team"].unique())

# Position-aware display name for every player.
df["display_player"] = df.apply(
    lambda r: display_name(r["player"], r["position"]),
    axis=1
)

# ---------------------------------------------------------
# TABS
# ---------------------------------------------------------

tab1, tab2, tab3, tab4 = st.tabs([
    "🔥 Current Draft",
    "👤 Player History",
    "🔗 Combinations",
    "📊 Historical Teams"
])


# =========================================================
# CURRENT DRAFT
# =========================================================

with tab1:
    st.header("Current Draft")

    st.write(
        "Enter players selected in the current draft. "
        "Use one player per line or separate players with commas."
    )

    current_text = st.text_area(
        "Current players",
        height=180,
        placeholder=(
            "Matt Grimes\n"
            "Tyrick Mitchell\n"
            "Dominik Szoboszlai\n"
            "David Raya"
        )
    )

    current_players = [
        x.strip()
        for x in current_text.replace(",", "\n").splitlines()
        if x.strip()
    ]

    if not current_players:
        st.info("Enter some current draft selections above.")
    else:
        lookup = {
            p.lower(): p
            for p in unique_players
        }

        position_lookup = (
            df.drop_duplicates("player")
            .set_index("player")["position"]
            .to_dict()
        )

        normalized_current = []

        for p in current_players:
            normalized_current.append(
                lookup.get(p.lower(), p)
            )

        st.subheader("Current selections")

        cols = st.columns(min(5, max(1, len(normalized_current))))

        for i, player in enumerate(normalized_current):
            pos = position_lookup.get(player, "?")
            cols[i % len(cols)].metric(
                "Player",
                display_name(player, pos)
            )

        st.divider()

        # Historical usage
        st.subheader("Historical usage")

        history_rows = []

        for player in normalized_current:
            matches = df[
                df["player"].str.lower() == player.lower()
            ]

            teams_for_player = matches["team"].unique().tolist()
            positions = matches["position"].unique().tolist()

            position = positions[0] if positions else "?"

            history_rows.append({
                "Player": display_name(player, position),
                "Historical Teams": len(teams_for_player),
                "Times Selected": len(matches),
                "Teams": ", ".join(teams_for_player)
            })

        history_df = pd.DataFrame(history_rows)

        st.dataframe(
            history_df,
            use_container_width=True,
            hide_index=True
        )

        # Historical team overlap
        st.subheader("Which historical teams look most like this draft?")

        overlap_rows = []
        current_set = set(p.lower() for p in normalized_current)

        for team in team_names:
            team_df = df[df["team"] == team]
            team_players = set(team_df["player"].str.lower())

            shared_names = current_set.intersection(team_players)

            shared_display = []

            for name in shared_names:
                row = team_df[
                    team_df["player"].str.lower() == name
                ].iloc[0]

                shared_display.append(
                    display_name(row["player"], row["position"])
                )

            overlap_rows.append({
                "Historical Team": team,
                "Players Shared": len(shared_names),
                "Shared Players": ", ".join(sorted(shared_display))
            })

        overlap_df = pd.DataFrame(overlap_rows).sort_values(
            "Players Shared",
            ascending=False
        )

        st.dataframe(
            overlap_df,
            use_container_width=True,
            hide_index=True
        )

        # Current combinations
        if len(normalized_current) >= 2:
            st.subheader("Current-player combination history")

            combination_rows = []

            for r in range(
                2,
                min(4, len(normalized_current)) + 1
            ):
                for combo in combinations(normalized_current, r):
                    combo_set = set(x.lower() for x in combo)
                    matching_teams = []

                    for team in team_names:
                        players = set(
                            df[df["team"] == team]["player"].str.lower()
                        )

                        if combo_set.issubset(players):
                            matching_teams.append(team)

                    labels = []

                    for player in combo:
                        match = df[
                            df["player"].str.lower() == player.lower()
                        ].iloc[0]
                        labels.append(
                            display_name(
                                match["player"],
                                match["position"]
                            )
                        )

                    combination_rows.append({
                        "Combination": " + ".join(labels),
                        "Players": r,
                        "Times Together": len(matching_teams),
                        "Historical Teams": ", ".join(matching_teams)
                    })

            combo_df = pd.DataFrame(combination_rows).sort_values(
                "Times Together",
                ascending=False
            )

            st.dataframe(
                combo_df,
                use_container_width=True,
                hide_index=True
            )


# =========================================================
# PLAYER HISTORY
# =========================================================

with tab2:
    st.header("Player History")

    player_options = sorted(
        unique_players,
        key=lambda p: p.lower()
    )

    selected_player = st.selectbox(
        "Choose a player",
        player_options,
        format_func=lambda p: display_name(
            p,
            df[df["player"] == p]["position"].iloc[0]
        )
    )

    player_rows = df[df["player"] == selected_player]

    st.metric(
        "Times selected historically",
        len(player_rows)
    )

    st.metric(
        "Different historical teams",
        player_rows["team"].nunique()
    )

    st.subheader("Historical teams")

    player_history = player_rows.copy()
    player_history["Player"] = player_history.apply(
        lambda r: display_name(r["player"], r["position"]),
        axis=1
    )

    st.dataframe(
        player_history[["team", "Player"]].rename(columns={
            "team": "Historical Team"
        }),
        use_container_width=True,
        hide_index=True
    )

    st.subheader("Most common teammates")

    teammate_counter = Counter()
    teammate_position = {}

    for team in player_rows["team"].unique():
        teammates = df[
            (df["team"] == team) &
            (df["player"] != selected_player)
        ][["player", "position"]]

        for _, teammate in teammates.iterrows():
            teammate_counter[teammate["player"]] += 1
            teammate_position[teammate["player"]] = teammate["position"]

    teammate_data = []

    for teammate, count in teammate_counter.most_common():
        teammate_data.append({
            "Teammate": display_name(
                teammate,
                teammate_position[teammate]
            ),
            "Times Together": count
        })

    if teammate_data:
        st.dataframe(
            pd.DataFrame(teammate_data),
            use_container_width=True,
            hide_index=True
        )


# =========================================================
# COMBINATIONS
# =========================================================

with tab3:
    st.header("Historical Player Combinations")

    combination_size = st.radio(
        "Combination size",
        [2, 3],
        horizontal=True
    )

    counter = Counter()
    combination_teams = {}
    combination_positions = {}

    for team in team_names:
        team_df = df[df["team"] == team]
        players = sorted(team_df["player"].unique())

        for combo in combinations(players, combination_size):
            counter[combo] += 1
            combination_teams.setdefault(combo, []).append(team)

            for player in combo:
                row = team_df[team_df["player"] == player].iloc[0]
                combination_positions[player] = row["position"]

    combination_rows = []

    for combo, count in counter.most_common():
        labels = [
            display_name(
                player,
                combination_positions.get(player, "?")
            )
            for player in combo
        ]

        combination_rows.append({
            "Combination": " + ".join(labels),
            "Times Together": count,
            "Historical Teams": ", ".join(
                combination_teams[combo]
            )
        })

    combinations_df = pd.DataFrame(combination_rows)

    search = st.text_input(
        "Search for a player (optional)"
    )

    if search:
        combinations_df = combinations_df[
            combinations_df["Combination"].str.contains(
                search,
                case=False,
                na=False
            )
        ]

    st.dataframe(
        combinations_df,
        use_container_width=True,
        hide_index=True
    )


# =========================================================
# HISTORICAL TEAMS
# =========================================================

with tab4:
    st.header("Historical Teams")

    selected_team = st.selectbox(
        "Choose historical team",
        team_names
    )

    team_df = df[df["team"] == selected_team].copy()

    team_df["Player"] = team_df.apply(
        lambda r: display_name(r["player"], r["position"]),
        axis=1
    )

    st.subheader(selected_team)

    st.dataframe(
        team_df[["position", "Player"]].rename(columns={
            "position": "Position"
        }),
        use_container_width=True,
        hide_index=True
    )

    st.subheader("Team summary")

    position_counts = team_df["position"].value_counts()
    cols = st.columns(4)

    for i, position in enumerate(["F", "M", "D", "G"]):
        cols[i].metric(
            position,
            int(position_counts.get(position, 0))
        )

    st.subheader("Most similar historical teams")

    selected_players = set(team_df["player"])

    similarity_rows = []

    for other_team in team_names:
        if other_team == selected_team:
            continue

        other_players = set(
            df[df["team"] == other_team]["player"]
        )

        shared = selected_players.intersection(other_players)

        shared_display = []

        for player in shared:
            row = df[
                (df["team"] == other_team) &
                (df["player"] == player)
            ].iloc[0]

            shared_display.append(
                display_name(
                    row["player"],
                    row["position"]
                )
            )

        similarity_rows.append({
            "Team": other_team,
            "Shared Players": len(shared),
            "Players": ", ".join(sorted(shared_display))
        })

    similarity_df = pd.DataFrame(similarity_rows).sort_values(
        "Shared Players",
        ascending=False
    )

    st.dataframe(
        similarity_df,
        use_container_width=True,
        hide_index=True
    )


st.divider()

st.caption(
    f"Database: {selected_sheet} · "
    f"{len(team_names)} historical teams · "
    f"{len(unique_players)} unique players"
)
